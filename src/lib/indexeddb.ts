/**
 * IndexedDB를 사용한 대용량 파일 저장/로드
 * 브라우저에 수백 MB ~ 수 GB까지 저장 가능
 */

interface EditorData {
  files: Array<{
    originalFile: {
      id: string;
      name: string;
      size: number;
      arrayBuffer: ArrayBuffer;
    };
    selectedPageIndices: number[];
    currentSelectedIndices: number[];
    totalPages: number;
  }>;
  fileName: string;
}

const DB_NAME = 'pdf-editor-db';
const DB_VERSION = 1;
const STORE_NAME = 'editor-data';

/**
 * IndexedDB 초기화
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB 초기화 실패'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * 편집기 데이터를 IndexedDB에 저장
 */
export async function saveEditorData(data: EditorData): Promise<void> {
  try {
    // 먼저 모든 파일을 ArrayBuffer로 변환 (트랜잭션 열기 전에)
    console.log('파일을 ArrayBuffer로 변환 중...');
    const filesWithBuffers = await Promise.all(
      data.files.map(async (file, index) => {
        try {
          console.log(`파일 ${index + 1}/${data.files.length} 변환 중: ${file.originalFile.name}`);
          const arrayBuffer = await file.originalFile.file.arrayBuffer();
          // ArrayBuffer 복사본 생성 (transferable 방지)
          const bufferCopy = arrayBuffer.slice(0);
          return {
            ...file,
            originalFile: {
              id: file.originalFile.id,
              name: file.originalFile.name,
              size: file.originalFile.size,
              arrayBuffer: bufferCopy,
            },
          };
        } catch (error) {
          console.error(`파일 ${file.originalFile.name} 변환 실패:`, error);
          throw new Error(`파일 "${file.originalFile.name}" 변환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
      })
    );

    const totalSize = filesWithBuffers.reduce((sum, f) => sum + f.originalFile.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log(`ArrayBuffer 변환 완료: ${filesWithBuffers.length}개 파일, ${totalSizeMB}MB`);
    console.log('IndexedDB 트랜잭션 시작...');

    // ArrayBuffer 변환이 완료된 후에 트랜잭션 시작
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const dataToSave = {
      id: 'current-editor-data',
      ...data,
      files: filesWithBuffers,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => {
        console.log('IndexedDB 저장 성공');
        resolve();
      };
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        console.error('IndexedDB 저장 오류:', error);
        reject(new Error(`IndexedDB 저장 실패: ${error?.message || '알 수 없는 오류'}`));
      };
      
      // 트랜잭션이 완료될 때까지 대기
      transaction.oncomplete = () => {
        db.close();
        console.log('IndexedDB에 데이터 저장 완료:', {
          파일수: data.files.length,
          총용량: `${totalSizeMB}MB`,
        });
      };
      
      transaction.onerror = (event) => {
        const error = (event.target as Event)?.target;
        console.error('트랜잭션 오류:', error);
        reject(new Error('트랜잭션 실패'));
      };
    });
  } catch (error) {
    console.error('IndexedDB 저장 오류:', error);
    throw error;
  }
}

/**
 * IndexedDB에서 편집기 데이터 로드
 */
export async function loadEditorData(): Promise<EditorData | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const data = await new Promise<any>((resolve, reject) => {
      const request = store.get('current-editor-data');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('데이터 로드 실패'));
    });

    db.close();

    if (!data) {
      return null;
    }

    // ArrayBuffer를 File 객체로 변환
    const restoredFiles = data.files.map((fileData: any) => {
      if (!fileData.originalFile || !fileData.originalFile.arrayBuffer) {
        throw new Error(`파일 데이터가 올바르지 않습니다: ${fileData.originalFile?.name || '알 수 없음'}`);
      }

      // ArrayBuffer 복사 (IndexedDB에서 가져온 ArrayBuffer는 transferable이므로 복사 필요)
      let arrayBuffer = fileData.originalFile.arrayBuffer;
      if (arrayBuffer instanceof Array) {
        // 배열로 저장된 경우 Uint8Array로 변환
        arrayBuffer = new Uint8Array(arrayBuffer).buffer;
      } else if (!(arrayBuffer instanceof ArrayBuffer)) {
        // 다른 형태인 경우 시도
        try {
          arrayBuffer = arrayBuffer.buffer || arrayBuffer;
        } catch (e) {
          throw new Error(`ArrayBuffer 변환 실패: ${fileData.originalFile.name}`);
        }
      }

      // ArrayBuffer 복사본 생성 (transferable 방지)
      const bufferCopy = arrayBuffer.slice(0);

      const file = new File([bufferCopy], fileData.originalFile.name, {
        type: 'application/pdf',
      });

      return {
        originalFile: {
          id: fileData.originalFile.id,
          file,
          name: fileData.originalFile.name,
          size: fileData.originalFile.size,
        },
        selectedPageIndices: fileData.selectedPageIndices || [],
        currentSelectedIndices: fileData.currentSelectedIndices || fileData.selectedPageIndices || [],
        totalPages: fileData.totalPages,
      };
    });

    return {
      files: restoredFiles,
      fileName: data.fileName,
    };
  } catch (error) {
    console.error('IndexedDB 로드 오류:', error);
    return null;
  }
}

/**
 * IndexedDB 데이터 삭제
 */
export async function clearEditorData(): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete('current-editor-data');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('데이터 삭제 실패'));
    });

    db.close();
  } catch (error) {
    console.error('IndexedDB 삭제 오류:', error);
  }
}

/**
 * IndexedDB 사용 가능 여부 확인
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

