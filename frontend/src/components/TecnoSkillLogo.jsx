const TecnoSkillLogo = ({ className = 'w-32 h-10' }) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <div className="font-bold bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 bg-clip-text text-transparent text-xl tracking-tight">
      Mantech
    </div>
    <div className="text-xs font-semibold uppercase tracking-wider bg-primary-500/20 text-primary-500 px-2 py-0.5 rounded-full">
      Pro
    </div>
  </div>
);

export default TecnoSkillLogo;

