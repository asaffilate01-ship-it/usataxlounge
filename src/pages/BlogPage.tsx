import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { blogPosts } from "@/data/blogData";

const BlogPage = () => {
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <Button variant="ghost" asChild className="text-muted-foreground mb-4">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />{t("blog.backHome")}</Link>
            </Button>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="text-sm font-semibold tracking-wider uppercase text-accent">{t("blog.label")}</span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mt-3">{t("blog.pageTitle")}</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">{t("blog.pageSubtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-border bg-card shadow-elegant overflow-hidden hover:shadow-accent transition-all duration-300"
              >
                <Link to={`/blog/${post.slug}`}>
                  <div className="relative h-52 overflow-hidden">
                    <img src={post.image} alt={post.title[lang]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">{post.category[lang]}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime[lang]}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-card-foreground mb-2 group-hover:text-accent transition-colors">{post.title[lang]}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt[lang]}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all">
                      {t("blog.readMore")} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default BlogPage;
