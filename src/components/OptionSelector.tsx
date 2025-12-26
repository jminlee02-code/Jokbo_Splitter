import { ExtractionOptions } from '@/types';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface OptionSelectorProps {
  options: ExtractionOptions;
  onOptionsChange: (options: ExtractionOptions) => void;
}

export default function OptionSelector({
  options,
  onOptionsChange,
}: OptionSelectorProps) {
  const handleToggle = (key: keyof ExtractionOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    });
  };

  const optionLabels = {
    intro: '인트로',
    급분바: '급분바',
    문족: '문족',
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">추출 옵션</h3>
      <p className="text-sm text-gray-500 mb-4">
        원하는 섹션을 선택하세요 (중복 선택 가능)
      </p>
      <div className="space-y-3">
        {(Object.keys(options) as Array<keyof ExtractionOptions>).map(
          (key) => (
            <motion.label
              key={key}
              className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-gray-50 relative"
              style={{
                borderColor: options[key] ? '#0064FF' : '#E5E7EB',
                backgroundColor: options[key] ? '#F0F7FF' : 'transparent',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => handleToggle(key)}
                  className="w-5 h-5 appearance-none border-2 rounded-md cursor-pointer transition-all"
                  style={{
                    borderColor: options[key] ? '#0064FF' : '#D1D5DB',
                    backgroundColor: options[key] ? '#0064FF' : 'transparent',
                  }}
                />
                {options[key] && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
              <span className="font-medium text-gray-900">
                {optionLabels[key]}
              </span>
            </motion.label>
          )
        )}
      </div>
    </div>
  );
}

