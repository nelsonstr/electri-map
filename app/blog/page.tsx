import React from "react"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Blog - Best Practices During Power Outages",
    description: "Learn good practices to stay safe and prepared when electricity fails.",
}

const posts = [
    {
        title: "Prepare Emergency Lighting",
        excerpt: "Keep your family safe and see clearly when the lights go out.",
        image: "https://source.unsplash.com/featured/?flashlight",
        href: "/blog/lighting",
    },
    {
        title: "Preserve Food and Water",
        excerpt: "Learn how to keep your perishables fresh and stock up on essentials.",
        image: "https://source.unsplash.com/featured/?food,water",
        href: "/blog/preserve-food-water",
    },
    {
        title: "Stay Informed",
        excerpt: "Use battery-powered radios and charged devices to stay up-to-date.",
        image: "https://source.unsplash.com/featured/?radio",
        href: "/blog/stay-informed",
    },
    {
        title: "Conserve Phone Battery",
        excerpt: "Maximize your device's battery life during an outage.",
        image: "https://source.unsplash.com/featured/?phone,battery",
        href: "/blog/conserve-battery",
    },
    {
        title: "Use Backup Power Safely",
        excerpt: "Generator and battery guidelines to avoid hazards.",
        image: "https://source.unsplash.com/featured/?generator",
        href: "/blog/backup-power",
    },
    {
        title: "Stay Warm (or Cool)",
        excerpt: "Tips for maintaining comfort in extreme temperatures.",
        image: "https://source.unsplash.com/featured/?blanket,fan",
        href: "/blog/stay-comfortable",
    },
    {
        title: "Plan for Medical Needs",
        excerpt: "Ensure critical medications and equipment remain operational.",
        image: "https://source.unsplash.com/featured/?medical",
        href: "/blog/medical-needs",
    },
]

export default function BlogPage() {
    return (
        <main className="prose prose-lg mx-auto p-8">
            <h1>Power Outage Best Practices</h1>
            <p>Insights and tips to keep you safe and prepared when the lights go out.</p>

            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                    <div key={post.href} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        {/*        <div className="relative h-48 w-full">
                            <Image src={post.image} alt={post.title} layout="fill" objectFit="cover" />
                        </div> */}
                        <div className="p-4">
                            <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                            <p className="text-gray-600 mb-4">{post.excerpt}</p>
                            <Link href={post.href} className="text-blue-600 hover:underline">
                                Read More →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
} 
