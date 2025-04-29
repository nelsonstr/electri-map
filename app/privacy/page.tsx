import React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy - Electricity Status Map",
    description: "Privacy policy for Electricity Status Map. We value your privacy and comply with GDPR and US regulations.",
}

export default function PrivacyPage() {
    return (
        <main className="prose prose-lg max-w-3xl mx-auto p-8">
            <h1>Privacy Policy</h1>
            <p>This is a minimum viable product (MVP). We do not collect any personal data from users. All reports are anonymous with no personal identifiers stored.</p>
            <p>We do not use cookies, analytics, or any tracking technologies.</p>
            <p>For questions, contact <a href="mailto:electri.map@proton.me">electri.map@proton.me</a>.</p>
        </main>
    )
} 
