import React from 'react';
import { MapPin } from 'lucide-react';

export default function LocationLink({ url, className }) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: 'var(--primary-color)',
        textDecoration: 'none',
        fontWeight: '500',
        fontSize: '0.875rem'
      }}
    >
      <MapPin size={18} />
      Ver no Mapa
    </a>
  );
}
