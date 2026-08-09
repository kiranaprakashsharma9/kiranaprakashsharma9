"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

const shuffleItems = (items) => {
  return [...items].sort(() => Math.random() - 0.5);
};

const Shuba = ({ showBackButton = true, previewCount = null }) => {
  const router = useRouter();
  const { t } = useLanguage();

  const [shubaImages, setShubaImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery_images')
        .select('id, caption, image_url')
        .eq('category', 'shuba')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading Shuba images:', error);
        setShubaImages([]);
      } else {
        let items = data.map((item) => ({
          id: item.id,
          title: item.caption || 'Shuba Image',
          src: item.image_url,
        }));

        if (previewCount && items.length > previewCount) {
          items = shuffleItems(items).slice(0, previewCount);
        }

        setShubaImages(items);
      }
      setLoading(false);
    };

    loadImages();
  }, [previewCount]);

  const openLightbox = (index) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const showPrev = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? shubaImages.length - 1 : prev - 1));
  };

  const showNext = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === shubaImages.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null || shubaImages.length === 0) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') setSelectedIndex((prev) => (prev === 0 ? shubaImages.length - 1 : prev - 1));
      if (e.key === 'ArrowRight') setSelectedIndex((prev) => (prev === shubaImages.length - 1 ? 0 : prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, shubaImages.length]);

  // trigger animations when thumbnails enter viewport
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    const elems = document.querySelectorAll('#shuba .will-animate');
    elems.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [shubaImages, loading]);

  // Download image helper (fetches blob then triggers download)
  const downloadImage = async (url, filename) => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed, opening in new tab', err);
      // Fallback: open image in new tab
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <div id="shuba" className="py-24 bg-white scroll-mt-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showBackButton && (
          <button 
            onClick={() => router.back()} 
            className="mb-8 flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white transition-all duration-300 shadow-sm group"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="text-center mb-16">
          <h2 className="text-base text-orange-600 font-bold tracking-widest uppercase">{t.shuba.headerTitle}</h2>
          <p className="mt-2 text-4xl font-extrabold text-gray-900">{t.shuba.headerSubTitle}</p>
          <div className="mt-4 w-24 h-1.5 bg-orange-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-gray-500">
              {t.shuba.loadingText || 'Loading images...'}
            </div>
          ) : shubaImages.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500">
              {t.shuba.noImagesText || 'No images to display database is Empty'}
            </div>
          ) : (
            shubaImages.map((image, index) => (
              <div
                key={image.id}
                onClick={() => openLightbox(index)}
                className="group relative rounded-xl sm:rounded-2xl overflow-hidden shadow-md border-2 border-transparent hover:border-orange-400 transition-all duration-300 cursor-pointer will-animate"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const safeName = (image.title || image.id).toString().replace(/\s+/g, '_');
                    downloadImage(image.src, `${safeName}.jpg`);
                  }}
                  aria-label={t.shuba.downloadAria || 'Download image'}
                  className="absolute top-2 right-2 z-20 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 10l5 5 5-5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15V3" />
                  </svg>
                </button>
                <div className="bg-orange-50 relative aspect-square sm:aspect-video overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-2 sm:p-4 w-full">
                    <h3 className="text-white font-bold text-xs sm:text-lg text-center leading-tight">
                      {image.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {previewCount ? (
          <div className="mt-8 text-center">
            <Link
              href="/shuba"
              className="inline-flex items-center rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition"
            >
              {t.shuba.viewMoreButton || 'View more Shuba images'}
            </Link>
          </div>
        ) : null}

      </div>

      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-8"
          onClick={closeLightbox}
        >
          <button 
            onClick={closeLightbox}
            aria-label={t.shuba.lightboxCloseAria}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/70 hover:text-white p-2 z-[110] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const safeName = (shubaImages[selectedIndex].title || shubaImages[selectedIndex].id).toString().replace(/\s+/g, '_');
              downloadImage(shubaImages[selectedIndex].src, `${safeName}.jpg`);
            }}
            aria-label={t.shuba.downloadAria || 'Download image'}
            className="absolute top-4 right-14 sm:top-8 sm:right-20 text-white/80 hover:text-white p-2 z-[110] transition-colors bg-black/30 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 10l5 5 5-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15V3" />
            </svg>
          </button>

          <button 
            onClick={showPrev}
            aria-label={t.shuba.prevArrowAria}
            className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 p-2 sm:p-4 rounded-full z-[110] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            className="relative max-w-5xl max-h-full flex flex-col items-center animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={shubaImages[selectedIndex].src}
              alt={shubaImages[selectedIndex].title}
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl select-none"
            />
            <h3 className="text-white text-lg sm:text-2xl font-bold mt-4 tracking-wide">
              {shubaImages[selectedIndex].title}
            </h3>
            <p className="text-white/60 text-sm mt-1">
              {selectedIndex + 1} / {shubaImages.length}
            </p>
          </div>

          <button 
            onClick={showNext}
            aria-label={t.shuba.nextArrowAria}
            className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 p-2 sm:p-4 rounded-full z-[110] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
};

export default Shuba;
