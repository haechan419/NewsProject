// Tailwind CSS 처리를 위한 PostCSS 설정 파일 (Tailwind v4 방식)
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
  ],
};

