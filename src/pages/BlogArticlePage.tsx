import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import { blogPosts } from "@/data/blogData";

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLanguage();

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 text-center">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">Article Not Found</h1>
          <Button asChild><Link to="/blog">Back to Blog</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" asChild className="text-muted-foreground mb-6">
              <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-2" />{t("blog.backBlog")}</Link>
            </Button>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                {post.category[lang]}
              </span>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-4 mb-6">
                {post.title[lang]}
              </h1>
              <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
                <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{post.author}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{post.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.readTime[lang]}</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <img src={post.image} alt={post.title[lang]} className="w-full h-72 md:h-96 object-cover rounded-2xl mb-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-accent"
              dangerouslySetInnerHTML={{ __html: post.content[lang] }}
            />
          </div>
        </div>
      </article>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default BlogArticlePage;
