import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import blogHeaderImg from "@/assets/blog-header.jpg";
import aboutTeamImg from "@/assets/about-team.jpg";
import expatImg from "@/assets/expat-services.jpg";

const posts = [
  {
    image: blogHeaderImg,
    category: { en: "Tax Tips", es: "Consejos Fiscales" },
    title: { en: "2025 Tax Season: Key Deadlines & Changes You Need to Know", es: "Temporada de Impuestos 2025: Fechas Límite y Cambios Clave" },
    excerpt: {
      en: "New standard deduction amounts, updated tax brackets, and important filing deadlines for the 2025 tax season.",
      es: "Nuevos montos de deducción estándar, tramos fiscales actualizados y fechas límite importantes para la temporada 2025.",
    },
    date: "Feb 15, 2026",
    readTime: { en: "5 min read", es: "5 min lectura" },
  },
  {
    image: expatImg,
    category: { en: "Expat Taxes", es: "Impuestos de Expatriados" },
    title: { en: "FBAR Filing Guide: What US Expats Must Know in 2025", es: "Guía de FBAR: Lo Que los Expatriados Deben Saber en 2025" },
    excerpt: {
      en: "If you're a US citizen with foreign bank accounts exceeding $10,000, FBAR filing is mandatory. Here's your complete guide.",
      es: "Si es ciudadano de EE.UU. con cuentas bancarias extranjeras que superan $10,000, la presentación del FBAR es obligatoria.",
    },
    date: "Jan 28, 2026",
    readTime: { en: "7 min read", es: "7 min lectura" },
  },
  {
    image: aboutTeamImg,
    category: { en: "Small Business", es: "Pequeñas Empresas" },
    title: { en: "LLC vs S-Corp: Which Structure Saves You More on Taxes?", es: "LLC vs S-Corp: ¿Cuál Estructura Le Ahorra Más en Impuestos?" },
    excerpt: {
      en: "Choosing between an LLC and S-Corp can save you thousands. Our Enrolled Agents break down the key differences.",
      es: "Elegir entre una LLC y S-Corp puede ahorrarle miles. Nuestros Agentes Inscritos explican las diferencias clave.",
    },
    date: "Jan 10, 2026",
    readTime: { en: "6 min read", es: "6 min lectura" },
  },
];

const BlogSection = () => {
  const { lang, t } = useLanguage();

  return (
    <section id="blog" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("blog.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("blog.title")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card shadow-elegant overflow-hidden hover:shadow-accent transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title[lang]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {post.category[lang]}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime[lang]}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-card-foreground mb-2 group-hover:text-accent transition-colors">
                  {post.title[lang]}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {post.excerpt[lang]}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                  {t("blog.readMore")} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
