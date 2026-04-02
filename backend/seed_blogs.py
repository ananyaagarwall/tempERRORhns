"""
Seed blog posts into the database.
Run from the backend directory:
    python3 seed_blogs.py

Existing blogs with the same slug will be skipped.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app
from extensions import db
from models import Blog
from datetime import datetime

BLOGS = [
    {
        "slug": "real-estate-market-update-q2",
        "title": "Real Estate Market Update: Q2 Trends & Insights",
        "intro_paragraph": "A snapshot of current property prices, demand, and buyer behavior. Stay ahead of the curve with every insight the market has to offer this quarter.",
        "subheading1": "What's Driving Demand?",
        "content1": "A combination of stable interest rates and pent-up buyer demand from the post-pandemic years has driven residential sales to multi-year highs. Cities like Pune, Hyderabad, and Bengaluru are leading the charge, with affordable housing segments seeing the highest absorption rates.",
        "subheading2": "Price Trends Across Key Markets",
        "content2": "Mumbai MMR saw an average price appreciation of 7–9% year-on-year. Navi Mumbai and Thane continue to attract first-time buyers due to improved connectivity. In contrast, South Mumbai luxury prices plateaued as HNI investors shifted focus to plotted developments in Alibaug and Karjat.",
        "subheading3": "What Should Buyers Do?",
        "content3": "Experts recommend locking in a home loan now before any potential rate revision. Pre-launch pricing in under-construction projects still offers 10–15% savings over ready-to-move inventory. Always verify RERA registration and construction milestones before booking.",
        "meta_description": "Quarterly overview of India's real estate trends, price movements, and buyer behavior insights for informed decision-making.",
        "focus_keywords": "Real Estate, Market Update, Property Trends",
        "featured_image_alt": "Real Estate Market Trends Q2",
        "author": "HnS Editorial",
        "created_at": datetime(2024, 4, 10),
    },
    {
        "slug": "navi-mumbai-infra",
        "title": "Navi Mumbai Set for Major Infrastructure Boost",
        "intro_paragraph": "Navi Mumbai is undergoing a massive transformation with new metro lines, the international airport, and expanded expressways set to reshape property values across key nodes.",
        "subheading1": "Navi Mumbai International Airport",
        "content1": "The Navi Mumbai International Airport (NMIA), expected to be operational by late 2025, is the single biggest infrastructure catalyst in the region. Areas like Ulwe, Kharghar, and Panvel are already seeing speculative demand from investors anticipating a price surge post-launch.",
        "subheading2": "Metro Expansion Plans",
        "content2": "New metro corridors connecting Belapur to Khandeshwar and the planned Trans-Harbour Link extension will significantly cut commute times to South Mumbai. Residential projects along these corridors are being fast-tracked by developers who foresee a jump in end-user demand.",
        "subheading3": "Should You Invest Now?",
        "content3": "Industry analysts suggest that investors who buy in Navi Mumbai today will benefit from 2–3 years of infrastructure-led appreciation before prices fully reflect the new connectivity. However, due diligence on RERA compliance and builder reputation remains critical.",
        "meta_description": "Navi Mumbai's major infrastructure projects including the international airport and metro lines are set to significantly boost property prices.",
        "focus_keywords": "Navi Mumbai, Infrastructure, Real Estate Investment",
        "featured_image_alt": "Navi Mumbai Infrastructure Development",
        "author": "Admin",
        "created_at": datetime(2024, 3, 22),
    },
    {
        "slug": "down-payment-demystified",
        "title": "Down Payment Demystified",
        "intro_paragraph": "How much down payment is ideal, and how it impacts your loan burden? We break down the numbers so you can make a confident first move towards home ownership.",
        "subheading1": "What Is a Down Payment?",
        "content1": "In India, RBI regulations require buyers to fund at least 20% of the property value from their own savings. This is the down payment. Banks finance the remaining 80% (or less) as a home loan. However, a higher down payment reduces your EMI and total interest paid over the loan tenure.",
        "subheading2": "The 20% vs 30% Debate",
        "content2": "Financial planners often recommend putting down 30% if your savings allow. A 30% down payment on a ₹80 lakh home saves you approximately ₹14–16 lakhs in interest over a 20-year tenure compared to a 20% down payment assuming a 9% interest rate.",
        "subheading3": "Where to Source Your Down Payment",
        "content3": "Most buyers use a combination of savings, EPF withdrawals (allowed for home purchase), gifts from family, or liquidation of mutual funds. Avoid taking a personal loan to fund a down payment — the compounded cost can undermine the entire investment.",
        "meta_description": "Understand down payments for home buying in India — how much to pay, where to source it, and how it affects your home loan.",
        "focus_keywords": "Down Payment, Home Loan, Finance",
        "featured_image_alt": "Down Payment Guide for Home Buying",
        "author": "HnS Finance Desk",
        "created_at": datetime(2024, 2, 14),
    },
    {
        "slug": "home-buying-101",
        "title": "Home Buying 101: A Beginner's Guide",
        "intro_paragraph": "Start smart, buy smarter. This beginner's guide walks you through every step of the home buying journey, from budgeting to registration.",
        "subheading1": "Step 1: Set Your Budget",
        "content1": "Your total budget includes the property price, stamp duty (5–7% in Maharashtra), registration charges, GST on under-construction homes, and miscellaneous costs like legal fees and interior work. Use the 40x annual income rule as a rough ceiling for your property price.",
        "subheading2": "Step 2: Shortlist and Visit",
        "content2": "Visit at least 5–7 properties before shortlisting. Pay attention to the floor plan efficiency, natural light, ventilation, car parking provisions, and proximity to schools, hospitals, and public transport.",
        "subheading3": "Step 3: Legal Due Diligence",
        "content3": "Always verify the RERA registration number on the RERA website. Check title clarity, previous ownership chain, encumbrance certificate, and completion certificate for ready-to-move properties. Hire an independent advocate for document verification — do not rely solely on the builder's legal team.",
        "meta_description": "A comprehensive beginner's guide to buying a home in India — from budgeting and shortlisting to legal checks and registration.",
        "focus_keywords": "Home Buying, Beginner's Guide, First Time Buyer",
        "featured_image_alt": "Home Buying Beginner's Guide",
        "author": "HnS Editorial",
        "created_at": datetime(2024, 1, 30),
    },
    {
        "slug": "maharashtra-market-high",
        "title": "Maharashtra Real Estate Market Hits New High",
        "intro_paragraph": "Property registrations in Maharashtra surpassed all previous records in Q1 2024, driven by demand in Pune, Mumbai MMR, and Nashik.",
        "subheading1": "Record Registrations in Q1 2024",
        "content1": "Maharashtra recorded over 1.45 lakh property registrations in Q1 2024, a 22% jump year-on-year. Mumbai city alone saw 12,500+ registrations in March 2024 — the highest single-month figure since 2021.",
        "subheading2": "What's Driving the Numbers?",
        "content2": "Stable home loan rates around 8.5–9%, rising rental yields post-COVID, and strong employment growth in Pune's IT and manufacturing corridors have fuelled end-user demand. Developers are reporting that inventory absorption is outpacing new launches in mid-segment projects.",
        "subheading3": "Outlook for the Rest of 2024",
        "content3": "Analysts project a 6–8% price appreciation across Maharashtra's top markets in 2024. The second half of the year may see a slight correction in premium micro-markets if global liquidity tightens, but the mid-segment is expected to remain resilient.",
        "meta_description": "Maharashtra real estate hits record highs in 2024 with unprecedented property registrations across Mumbai, Pune, and Nashik.",
        "focus_keywords": "Maharashtra, Real Estate Market, Property Registration",
        "featured_image_alt": "Maharashtra Real Estate Market",
        "author": "Reporter",
        "created_at": datetime(2024, 3, 1),
    },
    {
        "slug": "boeser-trade-rumors",
        "title": "Boeser Trade Rumors: What's the Reality?",
        "intro_paragraph": "Real estate agents and analysts debate whether the current dip in Mumbai's luxury housing segment is a signal to buy or hold.",
        "subheading1": "The Luxury Market Slowdown",
        "content1": "Mumbai's ultra-luxury housing segment (₹5 crore+) saw a 15% dip in transactions in Q4 2023 compared to the same period in 2022. Brokers attribute this to cautious sentiment among HNIs amid global economic uncertainty and the upcoming election cycle.",
        "subheading2": "Is It a Buy Signal?",
        "content2": "Contrarian investors argue that downturns in premium segments create rare entry points. Locations like Worli Sea Face, Tardeo, and Juhu have historically bounced back within 12–18 months after any softening period. However, buyers must stress-test their assumptions against potential further softening.",
        "subheading3": "Expert Verdict",
        "content3": "Most senior analysts recommend a 'wait and watch' stance for the next one quarter, then evaluate based on RBI's next monetary policy signals and general election outcomes. Long-term fundamentals for Mumbai luxury remain intact due to constrained supply and UHNWI demand.",
        "meta_description": "A deep dive into the Mumbai luxury real estate slowdown — separating rumor from reality for informed investment decisions.",
        "focus_keywords": "Luxury Real Estate, Mumbai, Market Analysis",
        "featured_image_alt": "Mumbai Luxury Real Estate Analysis",
        "author": "Editor",
        "created_at": datetime(2024, 2, 5),
    },
    {
        "slug": "capsule-residences",
        "title": "Capsule Residences",
        "intro_paragraph": "Discover modern living at Capsule Residences, where innovative design meets comfort and convenience in every detail.",
        "subheading1": "A New Definition of Urban Living",
        "content1": "Capsule Residences redefines compact living with intelligently designed 1 and 2 BHK units that maximize every square foot. Japanese-inspired space planning ensures no corner goes to waste, while premium fittings create a premium feel throughout.",
        "subheading2": "Amenities and Community",
        "content2": "Residents enjoy a rooftop sky deck, co-working lounge, fully equipped gymnasium, and a curated community events calendar. The design philosophy centers on building connections — between neighbors, between work and rest, and between indoors and outdoors.",
        "subheading3": "Location Advantage",
        "content3": "Strategically located with excellent metro and road connectivity, Capsule Residences places residents within 20 minutes of major employment hubs, shopping districts, and educational institutions.",
        "meta_description": "Capsule Residences offers innovative compact living with premium finishes, smart space planning, and a vibrant community.",
        "focus_keywords": "Premium Housing, Compact Living, Urban Design",
        "featured_image_alt": "Capsule Residences Modern Living",
        "author": "HnS Editorial",
        "created_at": datetime(2022, 11, 15),
    },
    {
        "slug": "famous-heights",
        "title": "Famous Heights",
        "intro_paragraph": "Famous Heights offers premium apartments with breathtaking views, top-notch amenities, and a vibrant community atmosphere.",
        "subheading1": "Sky-High Living",
        "content1": "Famous Heights towers at 42 storeys, offering panoramic city and sea views from the upper floors. Spacious 3 and 4 BHK residences are crafted with Italian marble flooring, modular kitchens, and automated smart home systems as standard.",
        "subheading2": "World-Class Amenities",
        "content2": "A temperature-controlled swimming pool, spa, sports courts, kids' zone, amphitheater, and concierge services make Famous Heights more than a home — it's a lifestyle destination. Residents also benefit from 24th-floor sky gardens.",
        "subheading3": "Investment Potential",
        "content3": "Famous Heights is located in one of the city's fastest-appreciating micro-markets. Comparable projects in the vicinity have seen 15–18% price appreciation over the past three years, making it an attractive proposition for investors and end-users alike.",
        "meta_description": "Famous Heights offers premium apartments with panoramic views, world-class amenities, and strong investment potential.",
        "focus_keywords": "Premium Apartments, Luxury Living, Real Estate Investment",
        "featured_image_alt": "Famous Heights Premium Apartments",
        "author": "HnS Editorial",
        "created_at": datetime(2023, 2, 10),
    },
    {
        "slug": "hanging-gardens-towers",
        "title": "Hanging Gardens Towers",
        "intro_paragraph": "Experience luxury at Hanging Gardens Towers, featuring lush green spaces, modern architecture, and a prime city location.",
        "subheading1": "Green Living in the Heart of the City",
        "content1": "Hanging Gardens Towers introduces a radical concept: 40% of the development area is dedicated to green and open spaces. Vertical gardens on every floor, a 2-acre landscaped podium, and a rooftop botanical park redefine what urban living can feel like.",
        "subheading2": "Architecture That Breathes",
        "content2": "The towers' unique facade incorporates passive cooling techniques that reduce air conditioning loads by up to 20%. Cross-ventilation through strategically placed atriums and wind scoops means residents experience natural airflow on most days of the year.",
        "subheading3": "Specifications and Configurations",
        "content3": "Available in 2, 3, and 4 BHK formats, all residences feature floor-to-ceiling glazing for maximum light. Large balconies double as private gardens where residents can grow their own herbs and plants, supporting the development's sustainability charter.",
        "meta_description": "Hanging Gardens Towers blends luxury with sustainability, featuring vertical gardens, passive cooling, and green living in the urban heart.",
        "focus_keywords": "Luxury, Green Living, Sustainable Architecture",
        "featured_image_alt": "Hanging Gardens Towers Green Architecture",
        "author": "HnS Editorial",
        "created_at": datetime(2023, 5, 20),
    },
    {
        "slug": "hidden-costs-home-buying",
        "title": "Hidden Costs of Home Buying",
        "intro_paragraph": "Beyond the sale price lies a web of stamp duty, registration, GST, and maintenance deposits. Here's everything you need to budget for.",
        "subheading1": "Government Levies",
        "content1": "Stamp duty in Maharashtra ranges from 5–7% of the agreement value, with an additional 1% registration charge. These are due at the time of sale deed registration and must be paid upfront. Budget for this amount in your down payment planning.",
        "subheading2": "Developer Charges",
        "content2": "Builders often charge for car parking (₹3–10 lakh), club membership (₹1–3 lakh), infrastructure charges, and maintenance deposits (typically 2 years of maintenance paid upfront). These can add 5–8% to your total outgo over the base price.",
        "subheading3": "Post-Purchase Costs",
        "content3": "Interior work typically costs ₹800–1,500 per square foot for basic-to-mid-range finishing. Add moving costs, utility connection charges, and a 3–6 month emergency fund for any unforeseen repairs. First-time buyers often underestimate these costs by 15–20%.",
        "meta_description": "Uncover all the hidden costs of buying a home in India — from stamp duty and registration to developer charges and interior costs.",
        "focus_keywords": "Home Buying, Hidden Costs, Budget Planning",
        "featured_image_alt": "Hidden Costs of Home Buying in India",
        "author": "HnS Finance Desk",
        "created_at": datetime(2024, 1, 10),
    },
    {
        "slug": "emi-myths-you-should-ignore",
        "title": "EMI Myths You Should Ignore",
        "intro_paragraph": "Worried your EMI will choke your finances? We bust the 5 biggest myths around home loan EMIs so you can plan with confidence.",
        "subheading1": "Myth 1: EMI Should Be Below 30% of Income",
        "content1": "The 30% rule is outdated for high-income earners. Banks use the Fixed Obligation to Income Ratio (FOIR), which allows up to 50–55% of net monthly income for all EMI obligations combined. With smart financial planning, many buyers comfortably service EMIs at 35–40% of income.",
        "subheading2": "Myth 2: Floating Rates Are Always Risky",
        "content2": "Over a 20-year loan tenure, floating rate EMIs have historically resulted in lower total interest payments than fixed rates in India, as rates tend to cycle down over long periods. Most financial advisors recommend floating rates for tenures exceeding 10 years.",
        "subheading3": "Myth 3: Prepayment Is Always Beneficial",
        "content3": "Prepayment makes sense when your loan's effective interest rate exceeds your investment return rate. If your mutual fund SIPs are earning 12% and your loan is at 8.5%, it may be mathematically better to continue the SIPs. Always run the numbers before prepaying.",
        "meta_description": "Debunking 5 common home loan EMI myths to help Indian home buyers plan smarter and borrow with confidence.",
        "focus_keywords": "EMI, Home Loan, Financial Planning",
        "featured_image_alt": "Home Loan EMI Myths Debunked",
        "author": "HnS Finance Desk",
        "created_at": datetime(2024, 1, 18),
    },
    {
        "slug": "home-loan-terms-explained",
        "title": "Home Loan Terms Explained",
        "intro_paragraph": "LTV, FOIR, MCLR — the home loan world is full of jargon. This glossary explains every term simply so you can negotiate with your bank.",
        "subheading1": "Key Acronyms Decoded",
        "content1": "LTV (Loan-to-Value): The percentage of the property value the bank will finance — capped at 80% by RBI for loans above ₹75 lakh. FOIR (Fixed Obligation to Income Ratio): The share of your income committed to all EMIs — banks allow up to 55%. MCLR (Marginal Cost of Funds Based Lending Rate): The internal benchmark rate banks use to price loans.",
        "subheading2": "Fixed vs Floating Rate",
        "content2": "Fixed rates stay constant throughout the tenure, offering EMI certainty. Floating rates change with the repo rate cycle. Most banks in India offer floating rates as the default product; fixed rate products often carry a 1–1.5% premium and come with a reset clause after 3–5 years.",
        "subheading3": "Processing Fees and Foreclosure Charges",
        "content3": "Processing fees typically range from 0.25–1% of the loan amount. Foreclosure charges on floating rate loans are zero per RBI regulation, but fixed rate loans can charge 2–4% of the outstanding principal. Always clarify this before signing.",
        "meta_description": "A plain-English glossary of home loan terms — LTV, FOIR, MCLR, processing fees, and more explained for Indian home buyers.",
        "focus_keywords": "Home Loan, Finance Glossary, Banking Terms",
        "featured_image_alt": "Home Loan Terms Explained",
        "author": "HnS Finance Desk",
        "created_at": datetime(2024, 2, 1),
    },
    {
        "slug": "how-much-house-can-you-afford",
        "title": "How Much House Can You Afford?",
        "intro_paragraph": "Use the 30% rule, your FOIR, and our quick calculator to figure out the exact bracket of home that fits your income and lifestyle.",
        "subheading1": "The 40x Income Rule",
        "content1": "A widely used thumb rule: your total home loan should not exceed 40x your monthly net income. For a monthly net income of ₹1 lakh, this puts your loan ceiling at ₹40 lakh. Add your down payment (20–30% of property value) to get your total budget.",
        "subheading2": "Factor in Future Cash Flow Changes",
        "content2": "If you expect income to grow at 8–10% annually, you can stretch slightly above the 40x rule. But also factor in planned expenses like children's education, parental care, or car upgrade that may reduce disposable income in 3–5 years.",
        "subheading3": "Don't Forget Opportunity Cost",
        "content3": "Locking savings into a home means lower liquidity. Ensure you maintain a 6-month emergency fund post-down payment. Consider whether a slightly smaller home with higher savings deployed in equity markets might build more long-term wealth than stretching for a premium property.",
        "meta_description": "Calculate how much house you can truly afford in India using income ratios, EMI capacity, and future cash flow planning.",
        "focus_keywords": "Home Affordability, Budget, Income Planning",
        "featured_image_alt": "Home Affordability Calculator Guide",
        "author": "HnS Editorial",
        "created_at": datetime(2024, 2, 20),
    },
    {
        "slug": "tax-benefits-homeowners",
        "title": "Tax Benefits for Homeowners",
        "intro_paragraph": "Section 80C, 24(b), and 80EEA can collectively save you over ₹3.5 lakh in taxes annually. Here's how to claim every rupee.",
        "subheading1": "Section 80C: Principal Repayment",
        "content1": "You can claim up to ₹1.5 lakh per year on the principal repayment component of your home loan EMI under Section 80C. This is shared with other 80C investments like PPF, ELSS, and life insurance premiums, so plan your portfolio accordingly.",
        "subheading2": "Section 24(b): Interest Deduction",
        "content2": "For a self-occupied property, you can deduct up to ₹2 lakh per year on home loan interest under Section 24(b). For let-out properties, there is no upper limit — the full interest paid can be deducted from rental income, often resulting in a loss that can be set off against salary income.",
        "subheading3": "Section 80EEA: First-Time Buyer Bonus",
        "content3": "First-time home buyers can claim an additional ₹1.5 lakh deduction on interest under Section 80EEA, subject to the property value being below ₹45 lakh and the loan having been sanctioned before March 31, 2022. Check with your CA to confirm eligibility.",
        "meta_description": "Maximize your tax savings as a homeowner in India — complete guide to Section 80C, 24(b), and 80EEA deductions.",
        "focus_keywords": "Tax Benefits, Section 80C, Home Loan Deductions",
        "featured_image_alt": "Tax Benefits for Indian Homeowners",
        "author": "HnS Finance Desk",
        "created_at": datetime(2024, 3, 5),
    },
    {
        "slug": "renting-vs-buying-today",
        "title": "Renting vs Buying Today",
        "intro_paragraph": "In India's current rate environment, is it smarter to rent or buy? We run the numbers across Mumbai, Pune, and Bangalore.",
        "subheading1": "The Price-to-Rent Ratio",
        "content1": "In Mumbai, the price-to-rent ratio exceeds 50 in most neighborhoods — meaning it takes over 50 years of pure rental income to recover the purchase price. This indicates that renting is numerically more efficient for short-to-medium holding periods (under 7–10 years).",
        "subheading2": "The Case for Buying",
        "content2": "That said, buying offers forced savings through equity build-up, permanent shelter security, and emotional value of ownership. With interest rates plateauing and construction costs rising, waiting for a price correction in Mumbai may mean paying more in rent with no asset creation over 3–5 years.",
        "subheading3": "City-Specific Verdict",
        "content3": "Pune and Bangalore offer better buy-vs-rent economics with tighter price-to-rent ratios (25–35x). For Mumbai, first-time buyers are advised to consider peripheral markets or wait for a rate softening event before committing. In any city, buying makes clear sense once your holding period exceeds 7 years.",
        "meta_description": "Renting vs buying in India's 2024 market — city-by-city analysis of price-to-rent ratios, investment returns, and the right choice for you.",
        "focus_keywords": "Renting, Buying, Real Estate Comparison",
        "featured_image_alt": "Renting vs Buying in India 2024",
        "author": "HnS Editorial",
        "created_at": datetime(2024, 3, 15),
    },
]


def seed():
    with app.app_context():
        added = 0
        skipped = 0
        for data in BLOGS:
            existing = Blog.query.filter_by(slug=data["slug"]).first()
            if existing:
                print(f"  [SKIP]  '{data['slug']}' already exists")
                skipped += 1
                continue

            blog = Blog(
                slug=data["slug"],
                title=data["title"],
                intro_paragraph=data["intro_paragraph"],
                subheading1=data.get("subheading1"),
                content1=data.get("content1"),
                subheading2=data.get("subheading2"),
                content2=data.get("content2"),
                subheading3=data.get("subheading3"),
                content3=data.get("content3"),
                meta_description=data.get("meta_description"),
                focus_keywords=data.get("focus_keywords"),
                featured_image_alt=data.get("featured_image_alt"),
                created_at=data.get("created_at", datetime.utcnow()),
            )
            db.session.add(blog)
            print(f"  [ADD]   '{data['slug']}'")
            added += 1

        db.session.commit()
        print(f"\nDone — {added} added, {skipped} skipped.")


if __name__ == "__main__":
    seed()
