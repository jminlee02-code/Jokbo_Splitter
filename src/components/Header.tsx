import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📚</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              인급문 생성기 <span className="text-xl">2.0</span>
            </h1>
            <p className="text-sm text-gray-500">for Yonsei Med</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

