import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import './style.css'

// React Strict Mode는 개발 환경에서 컴포넌트를 두 번 마운트하여
// 부작용을 찾아내지만, react-leaflet과 호환성 문제가 있어 비활성화
// 프로덕션 빌드에서는 자동으로 비활성화됨
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App></App>
)