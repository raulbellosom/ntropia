// front/src/components/Landing/LandingPage.jsx

import { useState, useEffect } from "react";
import {
  Layers,
  Users,
  Palette,
  Share2,
  Star,
  ArrowRight,
  Circle,
  Square,
  Triangle,
  ImageIcon,
  MapPin,
  Minus,
  Menu,
  X,
  Mail,
  Phone,
  MapPinIcon,
} from "lucide-react";
import NtropiaLogo from "../Logo/NtropiaLogo";
import workspaceCanvas from "../../assets/landing/workspace-canvas.png";
import dashboardPreview from "../../assets/landing/dashboard.png";

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

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-slate-700 bg-slate-800/50 shadow-sm backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardContent({ children, className = "" }) {
  return <div className={`p-4 md:p-6 ${className}`}>{children}</div>;
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md ${className}`}
    >
      {children}
    </span>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-4 lg:px-6 h-16 flex items-center transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-md bg-slate-900/90 border-b border-slate-700/50 shadow-lg"
            : "backdrop-blur-sm bg-slate-900/50 border-b border-slate-700/30"
        }`}
      >
        <div className="flex items-center space-x-2">
          <NtropiaLogo className="w-8 h-8" />
          <span className="text-xl font-bold text-white">Ntropia</span>
        </div>
        <nav className="ml-auto hidden md:flex gap-2">
          <a
            href="#features"
            className="text-sm px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors"
          >
            Características
          </a>
          <a
            href="#about"
            className="text-sm px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors"
          >
            Acerca de
          </a>
          <a
            href="#contact"
            className="text-sm px-4 py-2 font-medium text-slate-300 hover:text-white transition-colors"
          >
            Contacto
          </a>
        </nav>
        <div className="ml-6 hidden md:flex gap-2">
          <Button
            className="text-slate-300 px-4 py-2 hover:text-white hover:bg-slate-800"
            type="button"
          >
            Iniciar Sesión
          </Button>
          <Button
            className="bg-gradient-to-r px-4 py-2 from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            type="button"
          >
            Registrarse Gratis
          </Button>
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
            <div className="flex items-center space-x-2 mb-8">
              <NtropiaLogo className="w-8 h-8" />
              <span className="text-xl font-bold text-white">Ntropia</span>
            </div>
            <nav className="space-y-4 mb-8">
              <a
                href="#features"
                className="block text-lg font-medium text-slate-300 hover:text-white transition-colors py-2"
                onClick={closeMenu}
              >
                Características
              </a>
              <a
                href="#about"
                className="block text-lg font-medium text-slate-300 hover:text-white transition-colors py-2"
                onClick={closeMenu}
              >
                Acerca de
              </a>
              <a
                href="#contact"
                className="block text-lg font-medium text-slate-300 hover:text-white transition-colors py-2"
                onClick={closeMenu}
              >
                Contacto
              </a>
            </nav>
            <div className="space-y-3">
              <Button
                className="w-full text-slate-300 p-2 hover:text-white hover:bg-slate-800 justify-start"
                onClick={closeMenu}
                type="button"
              >
                Iniciar Sesión
              </Button>
              <Button
                className="w-full bg-gradient-to-r p-2 from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                onClick={closeMenu}
                type="button"
              >
                Registrarse Gratis
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="pt-16">
        <section className="relative px-4 py-12 lg:py-20">
          <div className="container mx-auto text-center">
            <Badge className="mb-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30">
              🎨 Completamente Gratuito
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Workspaces Colaborativos
              <span className="block bg-gradient-to-r from-cyan-400 via-green-400 to-yellow-400 bg-clip-text text-transparent">
                Haz tus ideas realidad
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Crea, colabora y diseña en tiempo real con herramientas
              profesionales. Agrega capas, formas, imágenes y marcadores de
              referencia como en Illustrator, pero con el poder de la
              colaboración en equipo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg"
                type="button"
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button
                className="border border-slate-600 text-slate-300 hover:bg-slate-800 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg bg-transparent"
                type="button"
              >
                Ver Demo
              </Button>
            </div>
            <div className="relative max-w-5xl mx-auto">
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-4 md:p-8">
                <img
                  src={workspaceCanvas}
                  alt="Interfaz de Ntropia mostrando workspace colaborativo"
                  className="rounded-lg shadow-2xl w-full h-auto"
                />
                <div className="absolute -top-2 md:-top-4 -right-2 md:-right-4 bg-gradient-to-r from-green-400 to-cyan-400 text-slate-900 px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-semibold">
                  ✨ En Vivo
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Herramientas Profesionales de Diseño */}
        <section id="features" className="px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Herramientas Profesionales de Diseño
            </h2>
            <p className="text-slate-300 mb-12 max-w-3xl mx-auto">
              Todo lo que necesitas para crear diseños increíbles con tu equipo
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="text-left">
                  <Layers className="text-cyan-400 mb-4" size={32} />
                  <h3 className="text-xl font-semibold mb-2">
                    Sistema de Capas
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Organiza tu trabajo en capas como en Illustrator. Controla
                    la visibilidad y orden de cada elemento.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-left">
                  <Palette className="text-green-400 mb-4" size={32} />
                  <h3 className="text-xl font-semibold mb-2">
                    Herramienta de Dibujo
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Círculos, cuadrados, líneas, flechas y más. Todas las formas
                    que necesitas para expresar tus ideas.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-left">
                  <MapPin className="text-yellow-400 mb-4" size={32} />
                  <h3 className="text-xl font-semibold mb-2">
                    Marcadores de Referencia
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Agrega puntos de referencia con imágenes para guiar a tu
                    equipo y mantener el contexto.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-left">
                  <Users className="text-pink-400 mb-4" size={32} />
                  <h3 className="text-xl font-semibold mb-2">
                    Colaboración en Tiempo Real
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Trabaja simultáneamente con tu equipo. Ve los cambios al
                    instante y colabora sin fricciones.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-left">
                  <ImageIcon className="text-purple-400 mb-4" size={32} />
                  <h3 className="text-xl font-semibold mb-2">
                    Soporte de Imágenes
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Importa y manipula imágenes directamente en tu workspace.
                    Perfecto para mockups y presentaciones.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-left">
                  <Share2 className="text-orange-400 mb-4" size={32} />
                  <h3 className="text-xl font-semibold mb-2">
                    Compartir Fácilmente
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Comparte tus proyectos con un enlace. Control de permisos y
                    acceso granular para cada colaborador.
                  </p>
                </CardContent>
              </Card>
            </div>
            {/* Herramientas disponibles */}
            <div className="mt-16">
              <div className="rounded-2xl bg-slate-900/80 backdrop-blur-lg border border-slate-700 shadow-md px-6 py-6 inline-block">
                <h4 className="text-white font-semibold text-lg mb-4 text-center">
                  Herramientas Disponibles
                </h4>
                <div className="flex flex-wrap justify-center gap-3">
                  <Badge className="bg-slate-800 border border-cyan-400 text-cyan-300">
                    <Circle className="w-4 h-4 mr-1" /> Círculos
                  </Badge>
                  <Badge className="bg-slate-800 border border-green-400 text-green-300">
                    <Square className="w-4 h-4 mr-1" /> Cuadrados
                  </Badge>
                  <Badge className="bg-slate-800 border border-yellow-400 text-yellow-300">
                    <Triangle className="w-4 h-4 mr-1" /> Triángulos
                  </Badge>
                  <Badge className="bg-slate-800 border border-slate-400 text-slate-300">
                    <Minus className="w-4 h-4 mr-1" /> Líneas
                  </Badge>
                  <Badge className="bg-slate-800 border border-purple-400 text-purple-300">
                    <ArrowRight className="w-4 h-4 mr-1" /> Flechas
                  </Badge>
                  <Badge className="bg-slate-800 border border-pink-400 text-pink-300">
                    <ImageIcon className="w-4 h-4 mr-1" /> Imágenes
                  </Badge>
                  <Badge className="bg-slate-800 border border-rose-400 text-rose-300">
                    <MapPin className="w-4 h-4 mr-1" /> Marcadores
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Dashboard Intuitivo */}
        <section className="px-4 py-20 md:py-28">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center rounded-2xl bg-slate-900/80 border border-slate-700 backdrop-blur-sm p-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Dashboard Intuitivo
              </h2>
              <p className="text-slate-300 mb-6 text-base md:text-lg">
                Gestiona todos tus proyectos desde un solo lugar. Crea nuevas
                mesas de trabajo, organiza por equipos y mantén el control total
                de tus diseños.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-3 h-3 mt-1 rounded-full bg-green-400"></span>
                  <span className="text-slate-300">
                    Proyectos organizados por fecha
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-3 h-3 mt-1 rounded-full bg-blue-400"></span>
                  <span className="text-slate-300">
                    Control de privacidad por proyecto
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-3 h-3 mt-1 rounded-full bg-purple-400"></span>
                  <span className="text-slate-300">
                    Colaboradores visibles en cada mesa
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <div className="rounded-xl overflow-hidden shadow-lg border border-slate-700">
                <img
                  src={dashboardPreview}
                  alt="Dashboard Ntropia"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>
        {/* Sección: Acerca de Ntropia */}
        <section id="about" className="px-4 py-20 md:py-28">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Acerca de Ntropia
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto mb-12">
              Revolucionamos la forma en que los equipos colaboran en proyectos
              de diseño
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-slate-300">
              <h3 className="text-xl font-semibold text-white">
                Nuestra Misión
              </h3>
              <p>
                Creemos que las mejores ideas surgen cuando los equipos pueden
                colaborar sin barreras. Ntropia elimina las limitaciones
                técnicas y geográficas, permitiendo que tu creatividad fluya
                plenamente.
              </p>
              <p>
                Combinamos la potencia de herramientas profesionales como
                Illustrator con la simplicidad de la colaboración en tiempo
                real, creando un espacio donde las ideas se transforman en
                realidad.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-6 rounded-xl text-center">
                <h4 className="text-3xl font-bold text-cyan-400">10K+</h4>
                <p className="text-slate-400 mt-2 text-sm">Usuarios Activos</p>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-6 rounded-xl text-center">
                <h4 className="text-3xl font-bold text-yellow-300">99.9%</h4>
                <p className="text-slate-400 mt-2 text-sm">Tiempo Activo</p>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-6 rounded-xl text-center">
                <h4 className="text-3xl font-bold text-pink-400">50K+</h4>
                <p className="text-slate-400 mt-2 text-sm">Proyectos Creados</p>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-6 rounded-xl text-center">
                <h4 className="text-3xl font-bold text-green-400">24/7</h4>
                <p className="text-slate-400 mt-2 text-sm">Soporte</p>
              </div>
            </div>
          </div>
        </section>
        {/* Sección: CTA final */}
        <section className="px-4 py-20 md:py-28 text-center bg-slate-900/80">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para transformar tu flujo de trabajo?
            </h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Únete a miles de equipos que ya están creando de forma más
              eficiente con Ntropia. Es completamente gratis y no requiere
              tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="px-6 py-2 font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-white">
                Crear Cuenta Gratis
              </Button>
              <Button className="px-6 py-2 font-semibold border border-slate-600 text-white hover:bg-slate-700">
                Programar Demo
              </Button>
            </div>
            <div className="flex flex-wrap justify-center mt-6 gap-4 text-sm text-slate-400">
              <span>✅ Sin tarjeta de crédito</span>
              <span>⚡ Configuración en 2 minutos</span>
              <span>📞 Soporte 24/7</span>
            </div>
          </div>
        </section>

        {/* Sección: Contacto (queda después del CTA) */}
        <section id="contact" className="px-4 py-20 md:py-28">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Contacto
              </h2>
              <p className="text-slate-300 mt-2">
                ¿Tienes preguntas? Estamos aquí para ayudarte
              </p>
            </div>

            <div className="md:flex md:items-start md:justify-between md:gap-12  rounded-xl p-6 md:p-10 backdrop-blur">
              <div className="md:w-1/3 space-y-6">
                <div className="space-y-6 text-sm md:pl-20">
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-white bg-gradient-to-tr from-cyan-500 to-blue-500 p-1 rounded-md" />
                    <div>
                      <p className="text-white font-semibold">Email</p>
                      <p className="text-slate-300">admin@racoondevs.com</p>
                      <p className="text-slate-300">raul.belloso.m@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 text-white bg-gradient-to-tr from-green-400 to-cyan-500 p-1 rounded-md" />
                    <div>
                      <p className="text-white font-semibold">Teléfono</p>
                      <p className="text-slate-300">+52 (322) 265-2650</p>
                      <p className="text-slate-300">
                        Lunes a viernes, 9:00 - 18:00
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPinIcon className="w-6 h-6 text-white bg-gradient-to-tr from-yellow-400 to-orange-500 p-1 rounded-md" />
                    <div>
                      <p className="text-white font-semibold">Oficina</p>
                      <p className="text-slate-300">Relampago #101</p>
                      <p className="text-slate-300">Puerto Vallarta, Jalisco</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:w-1/2 mt-10 md:mt-0">
                <form className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
                  <p className="text-white font-semibold text-base">
                    Envíanos un mensaje
                  </p>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full p-2 rounded-md bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className="w-full p-2 rounded-md bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                  <textarea
                    placeholder="¿En qué podemos ayudarte?"
                    rows="4"
                    className="w-full p-2 rounded-md bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                  <Button className="w-full py-2 font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110">
                    Enviar Mensaje
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Footer */}
      <footer className="bg-slate-900/80 text-slate-400 text-sm px-4 pt-20 pb-10 border-t border-slate-700">
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
                <a href="#" className="hover:text-white">
                  Características
                </a>
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
                <a href="#" className="hover:text-white">
                  Acerca de
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Carreras
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Contacto
                </a>
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
