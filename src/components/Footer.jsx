"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const scrollToTop = (e) => {
    e.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="bg-orange-600 text-white pt-5 pb-4 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">

        {/* Brand */}
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold tracking-wide">
            Kiranaprakashsharma9
          </h2>

          <p className="text-orange-200 text-sm mt-1 font-medium tracking-wider uppercase">
            Srirangapatana Purohit
          </p>
        </div>

        {/* Divider */}
        <div className="w-full max-w-3xl border-t border-orange-500 opacity-50 mb-2"></div>

        {/* Copyright */}
        <div className="text-center text-sm text-orange-100 flex flex-col gap-2 mb-6">

          <p className="text-xs sm:text-sm text-orange-200">
            {t.common.designedBy}{" "}
            <a
              href="https://kiranpkoundinya.github.io/Portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-orange-100 hover:underline transition-colors"
            >
              KIRAN P KOUNDINYA
            </a>{" "}
            &{" "}
            <a
              href="https://ravichandrals507.github.io/Portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-orange-100 hover:underline transition-colors"
            >
              RAVICHANDRA L S
            </a>
          </p>
        </div>

        {/* Back To Top */}
        <button
          onClick={scrollToTop}
          className="mt-10 flex items-center gap-2 text-sm font-bold text-orange-200 hover:text-white transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>

          {t.common.backToTop}
        </button>
      </div>
    </footer>
  );
};

export default Footer;