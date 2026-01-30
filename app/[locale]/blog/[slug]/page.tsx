import { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

const postKeys = [
    'lighting', 
    'preserveFoodWater', 
    'stayInformed', 
    'conserveBattery', 
    'backupPower', 
    'stayComfortable', 
    'medicalNeeds'
];

const postImages: Record<string, string> = {
    'lighting': "https://source.unsplash.com/featured/?flashlight",
    'preserveFoodWater': "https://source.unsplash.com/featured/?food,water",
    'stayInformed': "https://source.unsplash.com/featured/?radio",
    'conserveBattery': "https://source.unsplash.com/featured/?phone,battery",
    'backupPower': "https://source.unsplash.com/featured/?generator",
    'stayComfortable': "https://source.unsplash.com/featured/?blanket,fan",
    'medicalNeeds': "https://source.unsplash.com/featured/?medical"
};

async function getPostKey(slug: string): Promise<string | undefined> {
    const t = await getTranslations('blog.posts');
    return postKeys.find(key => t(`${key}.slug`) === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const t = await getTranslations('blog.posts');
    const key = await getPostKey(slug);
    
    if (!key) {
        return {
            title: 'Post Not Found'
        }
    }

    return {
        title: t(`${key}.title`),
        description: t(`${key}.excerpt`),
    }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const t = await getTranslations('blog.posts');
    const key = await getPostKey(slug);

    if (!key) {
        notFound();
    }

    // Use .raw() to get the array of strings
    // Note: In newer next-intl, we might need a specific way to get arrays or just iterate if structured.
    // However, t.raw() is the standard way for arrays if type safety allows. 
    // If t is strict, we might need to cast or use `getTranslations` on the specific key if it was an array... 
    // but here `blog.posts.key` is an object.
    
    // Instead of t.raw(), let's fetch the messages object for this specific post to ensure we get the array safely
    // Or we can just trust the usage of t.raw() if configured.
    // Safe approach: use `const content = t.raw(`${key}.content`) as string[];`
    
    const content = t.raw(`${key}.content`) as string[];

    return (
        <main className="max-w-4xl mx-auto p-8 space-y-12 min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="space-y-4 text-center">
                 <Link href="/blog" className="inline-flex items-center text-primary hover:underline text-sm font-medium mb-8">
                    ← Back to Blog
                </Link>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 pb-2">
                    {t(`${key}.title`)}
                </h1>
            </div>

            <div className="flex flex-col gap-12">
                <div className="w-full relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
                     {/* Using the image valid for the key */}
                     <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-105 duration-700"
                        style={{ backgroundImage: `url(${postImages[key]})` }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 leading-relaxed text-slate-700 dark:text-slate-300">
                    {Array.isArray(content) && content.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                    ))}
                </div>
            </div>
            
            <div className="border-t pt-12 mt-12 text-center">
                <Link href="/blog" className="inline-block px-8 py-3 rounded-full bg-slate-200 dark:bg-slate-800 font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                    View All Guides
                </Link>
            </div>
        </main>
    )
} 
