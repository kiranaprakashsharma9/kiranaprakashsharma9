"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabaseClient";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminLoggedIn(!!session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminLoggedIn(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;

    const target = document.querySelector(window.location.hash);

    if (!target) return;

    setTimeout(() => {
      target.classList.remove("bounce-target");
      void target.offsetWidth;
      target.classList.add("bounce-target");

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      setTimeout(() => {
        target.classList.remove("bounce-target");
      }, 900);
    }, 100);
  }, [pathname]);
  const { language, setLanguage, t } = useLanguage();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // The function that handles the scrolling and adds the bounce class
  const scrollAndBounce = (hash) => {
    const target = document.querySelector(hash);
    if (!target) return;

    // Remove the class if it exists, trigger a reflow, then add it back to restart the animation
    target.classList.remove("bounce-target");
    void target.offsetWidth;
    target.classList.add("bounce-target");

    // Smooth scroll to the section
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", hash);

    // Remove the class after the animation finishes (0.9s matches our CSS)
    window.setTimeout(() => {
      target.classList.remove("bounce-target");
    }, 900);
  };

  const handleNavClick = (event, link) => {
    setIsOpen(false);

    const hashIndex = link.href.indexOf("#");
    const hash = hashIndex !== -1 ? link.href.slice(hashIndex) : null;

    if (hash && pathname === "/") {
      event.preventDefault();
      scrollAndBounce(hash);
      window.history.replaceState(null, "", link.href);
      return;
    }

    if (hash) {
      event.preventDefault();
      router.push(link.href);
      return;
    }
  };

  const navLinks = [
    { name: t.common.home, href: "/#home" },
    { name: t.common.aboutUs, href: "/#about" },
    { name: t.common.poojaList, href: "/#services" },
    { name: t.common.review, href: "/#review" },
    { name: t.common.imagesShuba, href: "/shuba", isPage: true },
    { name: t.common.imagesAshuba, href: "/ashuba", isPage: true },
    { name: t.common.location, href: "/#location" },
    { name: t.common.contact, href: "/#contact" },
  ];

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-orange-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand Name */}
          <Link
            href="/"
            className="flex-shrink-0 flex flex-col justify-center hover:opacity-80 transition cursor-pointer"
          >
            <span className="font-bold text-xl tracking-wide leading-tight">
              {t.common.brandName}
            </span>
            <span className="text-sm text-orange-200 font-medium tracking-wider">
              {t.common.brandSubtitle}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            {navLinks.map((link) =>
              link.isPage ? (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className="hover:text-orange-200 transition px-3 py-2 rounded-md text-sm font-medium"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className="hover:text-orange-200 transition px-3 py-2 rounded-md text-sm font-medium"
                >
                  {link.name}
                </a>
              ),
            )}

            <Link
              href={isAdminLoggedIn ? "/admin/dashboard" : "/admin/login"}
              className="ml-2 pl-4 border-l border-orange-400 text-sm font-semibold text-orange-100 hover:text-white transition"
            >
              {isAdminLoggedIn ? "Dashboard" : "Admin Login"}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-orange-200 focus:outline-none"
            >
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={`lg:hidden bg-orange-700 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) =>
            link.isPage ? (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-orange-600 hover:text-white transition"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-orange-600 hover:text-white transition"
              >
                {link.name}
              </a>
            ),
          )}

          <Link
            href={isAdminLoggedIn ? "/admin/dashboard" : "/admin/login"}
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-orange-100 hover:bg-orange-600 hover:text-white transition border-t border-orange-600 mt-1 pt-3"
          >
            {isAdminLoggedIn ? "Admin Dashboard" : "Admin Login"}
          </Link>

          <div className="mt-3 px-3 pt-3 border-t border-orange-600">
            <p className="text-sm font-medium text-orange-100 mb-2">
              {t.home.englishLabel}/{t.home.kannadaLabel}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage("ENGLISH")}
                className={`w-full rounded-md py-2 text-sm font-bold transition ${language === "ENGLISH" ? "bg-white text-orange-700" : "bg-orange-600 text-white hover:bg-orange-500"}`}
              >
                {t.home.englishLabel}
              </button>
              <button
                type="button"
                onClick={() => setLanguage("KANNADA")}
                className={`w-full rounded-md py-2 text-sm font-bold transition ${language === "KANNADA" ? "bg-white text-orange-700" : "bg-orange-600 text-white hover:bg-orange-500"}`}
              >
                {t.home.kannadaLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
