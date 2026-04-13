import { useState, useEffect } from 'react';
import { isMockFirebase } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Rss, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  content: string;
  creator?: string;
}

interface RssFeedProps {
  url: string;
  isLight: boolean;
}

export function RssFeed({ url, isLight }: RssFeedProps) {
  const [feed, setFeed] = useState<{ title: string; items: RssItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  useEffect(() => {
    async function fetchFeed() {
      try {
        if (isMockFirebase) {
          setFeed({
            title: "Mock RSS Feed",
            items: [
              {
                title: "Mock Uutinen 1",
                link: "#",
                pubDate: new Date().toISOString(),
                contentSnippet: "Tämä on mock-uutinen 1.",
                content: "Tämä on mock-uutinen 1.",
                creator: "Ylläpito"
              },
              {
                title: "Mock Uutinen 2",
                link: "#",
                pubDate: new Date(Date.now() - 3600000).toISOString(),
                contentSnippet: "Tämä on mock-uutinen 2.",
                content: "Tämä on mock-uutinen 2.",
                creator: "Ylläpito"
              }
            ]
          });
          setLoading(false);
          return;
        }

        // Use a CORS proxy to fetch the RSS feed directly from the client
        const CORS_PROXY = "https://api.allorigins.win/raw?url=";
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Basic RSS/Atom parsing
        const isAtom = xmlDoc.querySelector('feed') !== null;
        const items: RssItem[] = [];
        
        if (isAtom) {
          const title = xmlDoc.querySelector('feed > title')?.textContent || 'RSS-syöte';
          const entries = xmlDoc.querySelectorAll('entry');
          entries.forEach(entry => {
            items.push({
              title: entry.querySelector('title')?.textContent || '',
              link: entry.querySelector('link')?.getAttribute('href') || '',
              pubDate: entry.querySelector('updated')?.textContent || entry.querySelector('published')?.textContent || new Date().toISOString(),
              contentSnippet: entry.querySelector('summary')?.textContent || entry.querySelector('content')?.textContent?.replace(/<[^>]*>?/gm, '').substring(0, 150) || '',
              content: entry.querySelector('content')?.textContent || entry.querySelector('summary')?.textContent || '',
              creator: entry.querySelector('author > name')?.textContent || undefined
            });
          });
          setFeed({ title, items: items.slice(0, 10) });
        } else {
          // RSS 2.0
          const title = xmlDoc.querySelector('channel > title')?.textContent || 'RSS-syöte';
          const elements = xmlDoc.querySelectorAll('item');
          elements.forEach(item => {
            items.push({
              title: item.querySelector('title')?.textContent || '',
              link: item.querySelector('link')?.textContent || '',
              pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
              contentSnippet: item.querySelector('description')?.textContent?.replace(/<[^>]*>?/gm, '').substring(0, 150) || '',
              content: item.querySelector('content\\:encoded')?.textContent || item.querySelector('description')?.textContent || '',
              creator: item.querySelector('dc\\:creator')?.textContent || item.querySelector('creator')?.textContent || undefined
            });
          });
          setFeed({ title, items: items.slice(0, 10) });
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching RSS:', err);
        setError('Syötteen haku epäonnistui.');
        setLoading(false);
      }
    }

    fetchFeed();
    // Refresh every 10 minutes
    const interval = setInterval(fetchFeed, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [url]);

  // Rotate items within the RSS view
  useEffect(() => {
    if (!feed || feed.items.length <= 1) return;
    
    const timer = setInterval(() => {
      setActiveItemIndex((prev) => (prev + 1) % feed.items.length);
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(timer);
  }, [feed]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xl font-medium animate-pulse">Haetaan uutisia...</p>
        </div>
      </div>
    );
  }

  if (error || !feed || feed.items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center p-12">
        <div className="space-y-4">
          <Rss className="h-16 w-16 mx-auto text-slate-500 opacity-20" />
          <p className="text-2xl text-slate-500">{error || 'Ei uutisia saatavilla.'}</p>
        </div>
      </div>
    );
  }

  const currentItem = feed.items[activeItemIndex];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-4 mb-10">
        <div className={`p-3 rounded-xl ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-900/30 text-indigo-400'}`}>
          <Rss className="h-8 w-8" />
        </div>
        <div className="flex flex-col">
          <span className={`text-xl font-bold tracking-widest uppercase ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            RSS-syöte
          </span>
          <h3 className={`text-2xl font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            {feed.title}
          </h3>
        </div>
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItemIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            <h2 className={`text-6xl font-bold leading-[1.1] ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {currentItem.title}
            </h2>

            <div className={`text-3xl leading-relaxed font-medium line-clamp-6 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {currentItem.contentSnippet || currentItem.content}
            </div>

            <div className="flex items-center gap-8 pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-slate-500" />
                <span className="text-xl text-slate-500">
                  {formatDistanceToNow(new Date(currentItem.pubDate), { addSuffix: true, locale: fi })}
                </span>
              </div>
              {currentItem.creator && (
                <div className="flex items-center gap-2">
                  <User className="h-6 w-6 text-slate-500" />
                  <span className="text-xl text-slate-500">{currentItem.creator}</span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {feed.items.map((_, i) => (
          <div 
            key={i}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === activeItemIndex 
                ? 'w-12 bg-indigo-500' 
                : 'w-2 bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
