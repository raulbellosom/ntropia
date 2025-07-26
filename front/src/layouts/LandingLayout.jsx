import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import NtropiaLogo from "../components/Logo/NtropiaLogo";
import { Link } from "react-router-dom";

function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

export default function LandingLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Función para navegación suave a secciones
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    closeMenu(); // Cerrar el menú móvil si está abierto
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-4 lg:px-6 h-16 flex items-center transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-md bg-slate-900/90 border-b border-slate-700/50 shadow-lg"
            : "backdrop-blur-sm bg-slate-900/50 border-b border-slate-700/30"
        }`}
      >
        <Link className="flex items-center space-x-2" to="/landing">
          <NtropiaLogo className="w-8 h-8" />
          <span className="text-xl font-bold text-white">Ntropia</span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-2">
          <button
            onClick={() => scrollToSection("features")}
            className="text-sm px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Características
          </button>
          <button
            onClick={() => scrollToSection("about")}
            className="text-sm px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Acerca de
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className="text-sm px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Contacto
          </button>
        </nav>
        <div className="ml-6 hidden md:flex gap-2">
          <Link
            to="/login"
            className="text-slate-300 px-3 py-1 rounded-md hover:text-white hover:bg-slate-800"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/register"
            className="bg-gradient-to-r px-3 py-1 rounded-md from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
          >
            Registrarse Gratis
          </Link>
        </div>
        <Button
          className="ml-auto md:hidden text-white hover:bg-slate-800"
          onClick={toggleMenu}
          type="button"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </header>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
        />
        <div
          className={`absolute top-0 right-0 h-full w-80 max-w-[80vw] bg-slate-900/95 backdrop-blur-md border-l border-slate-700/50 transform transition-transform duration-300 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6">
            <Link to="/landing" className="flex items-center space-x-2 mb-8">
              <NtropiaLogo className="w-8 h-8" />
              <span className="text-xl font-bold text-white">Ntropia</span>
            </Link>
            <nav className="space-y-4 mb-8">
              <button
                onClick={() => scrollToSection("features")}
                className="block text-lg font-medium text-slate-300 hover:text-white transition-colors py-2 w-full text-left"
              >
                Características
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="block text-lg font-medium text-slate-300 hover:text-white transition-colors py-2 w-full text-left"
              >
                Acerca de
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="block text-lg font-medium text-slate-300 hover:text-white transition-colors py-2 w-full text-left"
              >
                Contacto
              </button>
            </nav>
            <div className="space-y-3 flex flex-col">
              <Link
                to="/login"
                className="w-full rounded-md border border-sky-300 text-slate-300 p-2 hover:text-white hover:bg-slate-800 justify-start text-center"
                onClick={closeMenu}
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="w-full rounded-md bg-gradient-to-r p-2 from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-center"
                onClick={closeMenu}
              >
                Registrarse Gratis
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-16 text-inherit">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900/80 text-slate-400 text-sm px-4 pt-20 pb-10 border-t border-slate-700 mt-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
          <div className="space-y-3">
            <NtropiaLogo className="w-24 h-auto" />
            <p className="text-white text-base">
              La plataforma de workspaces colaborativos que hace realidad tus
              ideas de diseño.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Producto</h4>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="hover:text-white transition-colors text-left"
                >
                  Características
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Integraciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  API
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Empresa</h4>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => scrollToSection("about")}
                  className="hover:text-white transition-colors text-left"
                >
                  Acerca de
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="hover:text-white transition-colors text-left"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Soporte</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="hover:text-white">
                  Centro de ayuda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Documentación
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Estado del servicio
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Términos y privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-center border-t border-slate-700 pt-6 text-xs text-slate-500">
          © 2025 Ntropia. Todos los derechos reservados.
          <br />
          Hecho con ❤️ por RacoonDevs.
        </div>
      </footer>
    </div>
  );
}
