import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEOHead({
  title = 'AV 10 de Julio - Directorio de Empresas Automotrices',
  description = 'Encuentra los mejores servicios automotrices en tu zona. Talleres, repuestos, seguros y más. Conectamos clientes con empresas confiables del sector automotriz.',
  keywords = 'talleres, repuestos, servicios automotrices, seguros, revisión técnica, vulcanizaciones, reciclaje, automóviles, Chile',
  image = '/og-image.jpg',
  url = '',
  type = 'website',
  siteName = 'AV 10 de Julio',
  locale = 'es_CL',
  canonical = '',
  noindex = false,
  structuredData = null
}) {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const fullUrl = url ? `${import.meta.env.VITE_BASE_URL || 'https://av10dejulio.cl'}${url}` : '';
  const fullImage = image.startsWith('http') ? image : `${import.meta.env.VITE_BASE_URL || 'https://av10dejulio.cl'}${image}`;

  return (
    <Helmet>
      {/* Meta tags básicos */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="AV 10 de Julio" />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@av10dejulio" />
      <meta name="twitter:creator" content="@av10dejulio" />

      {/* Meta tags adicionales */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />

      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Preconnect para optimización */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
    </Helmet>
  );
}

// Componente específico para páginas de empresas
export function CompanySEOHead({ company }) {
  const title = `${company.nombre} - ${company.servicios?.join(', ') || 'Servicios Automotrices'} | AV 10 de Julio`;
  const description = `${company.descripcion || `Conoce ${company.nombre}, especialistas en ${company.servicios?.join(', ')}. ${company.direccion ? `Ubicados en ${company.direccion}.` : ''} Contacta y agenda tu servicio.`}`;
  const keywords = `${company.nombre}, ${company.servicios?.join(', ')}, ${company.categoria}, ${company.comuna}, servicios automotrices, taller mecánico`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "name": company.nombre,
    "description": company.descripcion,
    "url": `${import.meta.env.VITE_BASE_URL}/empresa/${company.id}`,
    "telephone": company.telefono,
    "email": company.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": company.direccion,
      "addressLocality": company.comuna,
      "addressRegion": company.region,
      "addressCountry": "CL"
    },
    "geo": company.coordenadas ? {
      "@type": "GeoCoordinates",
      "latitude": company.coordenadas.lat,
      "longitude": company.coordenadas.lng
    } : undefined,
    "openingHours": company.horarios?.map(horario => 
      `${horario.dia} ${horario.apertura}-${horario.cierre}`
    ),
    "priceRange": company.rangoPrecios || "$$",
    "paymentAccepted": company.metodosPago || ["Cash", "Credit Card"],
    "currenciesAccepted": "CLP",
    "image": company.logo || company.imagenes?.[0],
    "aggregateRating": company.calificacion ? {
      "@type": "AggregateRating",
      "ratingValue": company.calificacion,
      "reviewCount": company.totalResenas || 0
    } : undefined,
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": company.coordenadas ? {
        "@type": "GeoCoordinates",
        "latitude": company.coordenadas.lat,
        "longitude": company.coordenadas.lng
      } : undefined,
      "geoRadius": "50000"
    }
  };

  return (
    <SEOHead
      title={title}
      description={description}
      keywords={keywords}
      image={company.logo || company.imagenes?.[0]}
      url={`/empresa/${company.id}`}
      type="business.business"
      structuredData={structuredData}
    />
  );
}

// Componente específico para páginas de servicios
export function ServiceSEOHead({ service }) {
  const title = `${service.nombre} - Servicios Automotrices | AV 10 de Julio`;
  const description = `${service.descripcion || `Conoce nuestros servicios de ${service.nombre}. Profesionales especializados en el sector automotriz.`}`;
  const keywords = `${service.nombre}, servicios automotrices, ${service.categoria}, Chile`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.nombre,
    "description": service.descripcion,
    "provider": {
      "@type": "Organization",
      "name": "AV 10 de Julio",
      "url": import.meta.env.VITE_BASE_URL
    },
    "serviceType": service.categoria,
    "areaServed": {
      "@type": "Country",
      "name": "Chile"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "CLP",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <SEOHead
      title={title}
      description={description}
      keywords={keywords}
      url={`/servicios/${service.slug}`}
      type="service"
      structuredData={structuredData}
    />
  );
}

// Componente para páginas de artículos/recursos
export function ArticleSEOHead({ article }) {
  const title = `${article.titulo} | AV 10 de Julio`;
  const description = article.resumen || article.contenido?.substring(0, 160);
  const keywords = `${article.titulo}, ${article.tags?.join(', ')}, automóviles, consejos, mantenimiento`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.titulo,
    "description": description,
    "author": {
      "@type": "Organization",
      "name": "AV 10 de Julio"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AV 10 de Julio",
      "logo": {
        "@type": "ImageObject",
        "url": `${import.meta.env.VITE_BASE_URL}/logo.png`
      }
    },
    "datePublished": article.fechaPublicacion,
    "dateModified": article.fechaModificacion || article.fechaPublicacion,
    "image": article.imagen,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${import.meta.env.VITE_BASE_URL}/recursos/${article.slug}`
    }
  };

  return (
    <SEOHead
      title={title}
      description={description}
      keywords={keywords}
      image={article.imagen}
      url={`/recursos/${article.slug}`}
      type="article"
      structuredData={structuredData}
    />
  );
}
