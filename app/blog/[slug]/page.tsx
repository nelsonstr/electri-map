import Image from "next/image"
import { Metadata } from "next"
import Link from "next/link"

const posts: Record<string, { title: string; image: string; content: string[] }> = {
    "lighting": {
        title: "Prepare Emergency Lighting",
        image: "https://source.unsplash.com/featured/?flashlight",
        content: [
            "Keep flashlights and extra batteries in an easily accessible location.",
            "Opt for LED lanterns or headlamps to free your hands.",
            "Avoid candles when possible to reduce fire risk."
        ],
    },
    "preserve-food-water": {
        title: "Preserve Food and Water",
        image: "https://source.unsplash.com/featured/?food,water",
        content: [
            "Keep fridge and freezer doors closed to maintain safe temperatures.",
            "Use perishables first and discard unsafe foods when power returns.",
            "Store bottled water or fill clean containers ahead of an outage."
        ],
    },
    "stay-informed": {
        title: "Stay Informed",
        image: "https://source.unsplash.com/featured/?radio",
        content: [
            "Use a battery-powered or hand-crank radio for official updates.",
            "Charge phones beforehand and carry power banks for communication."
        ],
    },
    "conserve-battery": {
        title: "Conserve Phone Battery",
        image: "https://source.unsplash.com/featured/?phone,battery",
        content: [
            "Lower screen brightness and close background apps.",
            "Enable low-power mode and text instead of calling when possible."
        ],
    },
    "backup-power": {
        title: "Use Backup Power Safely",
        image: "https://source.unsplash.com/featured/?generator",
        content: [
            "Run generators outdoors in well-ventilated areas to avoid CO poisoning.",
            "Use heavy-duty, weatherproof extension cords rated for outdoor use."
        ],
    },
    "stay-comfortable": {
        title: "Stay Warm or Cool",
        image: "https://source.unsplash.com/featured/?blanket,fan",
        content: [
            "Keep blankets and warm clothing at hand in cold weather.",
            "Use battery fans or visit cooling centers during heatwaves."
        ],
    },
    "medical-needs": {
        title: "Plan for Medical Needs",
        image: "https://source.unsplash.com/featured/?medical",
        content: [
            "Ensure critical medical devices have backup power options.",
            "Inform someone nearby if you rely on electrically powered equipment."
        ],
    },
}

export function generateMetadata({ params: { slug } }: { params: { slug: string } }): Metadata {
    const post = posts[slug]
    return {
        title: post?.title || "Post Not Found",
        description: post?.content[0] || "",
    }
}

export default function PostPage({ params: { slug } }: { params: { slug: string } }) {
    const post = posts[slug]
    if (!post) {
        return (
            <main className="max-w-3xl mx-auto p-8 text-center">
                <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
                <Link href="/blog" className="text-blue-600 hover:underline text-lg">← Back to Blog</Link>
            </main>
        )
    }

    return (
        <main className="max-w-4xl mx-auto p-8 space-y-12">
            <h1 className="text-5xl font-bold text-center">{post.title}</h1>
            <div className="flex flex-col lg:flex-row lg:gap-12 items-start">
                <div className="lg:w-1/2">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
                        <Image src={post.image} alt={post.title} fill className="object-cover" />
                    </div>
                </div>
                <div className="lg:w-1/2 space-y-6 text-lg leading-relaxed">
                    {post.content.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                    ))}
                </div>
            </div>
            <div className="text-center">
                <Link href="/blog" className="inline-block text-blue-600 hover:underline text-lg">
                    ← Back to Blog
                </Link>
            </div>
        </main>
    )
} 
