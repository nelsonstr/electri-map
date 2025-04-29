import React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy - Electricity Status Map",
    description: "Privacy policy for Electricity Status Map. We value your privacy and comply with GDPR and US regulations.",
}

export default function PrivacyPage() {
    return (
        <main className="prose prose-lg space-y-8 max-w-3xl mx-auto p-8">
            <h1>Privacy Policy</h1>
            <p>
                Electricity Status Map (“we”, “us”, or “our”) operates this website to help users share information about
                electricity availability. Your privacy is important, and we are committed to protecting your personal data.
            </p>

            <section>
                <h2>Data We Collect</h2>
                <ul className="list-disc list-inside">
                    <li><strong>Location Data:</strong> You may choose to share latitude and longitude when reporting status.</li>
                    <li><strong>Report Details:</strong> Status (has electricity or not) and optional comments.</li>
                    <li><strong>Timestamp:</strong> The date and time when you submit your report.</li>
                </ul>
            </section>

            <section>
                <h2>How We Use Your Data</h2>
                <ul className="list-disc list-inside">
                    <li>To display up-to-date electricity status on the map.</li>
                    <li>To improve our service and keep data accurate.</li>
                </ul>
            </section>

            <section>
                <h2>Legal Basis</h2>
                <p>We process your data based on your explicit consent when you submit a report. You can withdraw consent at any time by contacting us.</p>
            </section>

            <section>
                <h2>Data Retention</h2>
                <p>Your reports are retained for up to 24 hours on the public map. Historical data may be archived for research but is anonymized.</p>
            </section>

            <section>
                <h2>Cookies and Tracking</h2>
                <p>We do not use cookies, analytics, or any tracking technologies on this site.</p>
            </section>

            <section>
                <h2>Third-Party Services</h2>
                <p>We use Supabase to store your submitted reports and OpenStreetMap tiles for mapping. No personal data is shared with third parties.</p>
            </section>

            <section>
                <h2>Your Rights</h2>
                <p>Under GDPR and applicable US privacy laws, you have the right to:</p>
                <ul className="list-disc list-inside">
                    <li>Request access to your data.</li>
                    <li>Request correction or deletion of your data.</li>
                    <li>Withdraw consent at any time.</li>
                </ul>
            </section>

            <section>
                <h2>Contact Us</h2>
                <p>
                    If you have questions or wish to exercise your rights, please contact us at:
                    <br />
                    <a href="mailto:electri.map@proton.me">electri.map@proton.me</a>
                </p>
            </section>
        </main>
    )
} 
