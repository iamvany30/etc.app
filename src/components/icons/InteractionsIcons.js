import React from 'react';

/*
  Этот файл содержит SVG-иконки, извлеченные из исходного кода проекта "итд".
  Все пути (path) и атрибуты скопированы идентично оригиналу.
*/

/**
 * Иконка Комментария
 */
export const CommentIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...props}>
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
    />
  </svg>
);

/**
 * Иконка Репоста
 */
export const RepostIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...props}>
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m2 9 3-3 3 3" />
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 18H7a2 2 0 0 1-2-2V6M22 15l-3 3-3-3" />
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 6h6a2 2 0 0 1 2 2v10" />
  </svg>
);

/**
 * Иконка Лайка (Сердце)
 * @param {boolean} active - Состояние лайка
 */
export const LikeIcon = ({ active = false, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...props}>
    {active ? (
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M17.57 3.221c-1.738-.533-4.103-.162-5.57 1.77-1.423-1.865-3.788-2.327-5.582-1.769C2.5 4.45 1.29 8.638 2.384 11.978 4.156 17.356 10.344 21 12.001 21c1.672 0 7.882-3.644 9.617-9.022 1.091-3.339-.123-7.527-4.048-8.757"
        clipRule="evenodd"
      />
    ) : (
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5.5C10.5 3.5 7.5 3 5.5 4.5S2.5 9 4 12c1.5 3 8 8 8 8s6.5-5 8-8 0-6-2-7.5-5-1-6 1"
      />
    )}
  </svg>
);

/**
 * Иконка Просмотров
 */
export const ViewIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Иконка Отправить (из комментариев)
 */
export const SendIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);