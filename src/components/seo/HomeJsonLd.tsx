export function HomeJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://iccb.com.bd/#organization",
        name: "International Convention City Bashundhara",
        alternateName: "ICCB",
        url: "https://iccb.com.bd",
        logo: "https://iccb.com.bd/brand/logo.png",
        telephone: ["+88-02-41091551", "+88-01991-197719"],
        email: "iccb@bga-bd.com",
        foundingDate: "2015-01-01",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Kuril Bishwa Road, Next to 300 ft. Purbachal Express Highway",
          addressLocality: "Dhaka",
          postalCode: "1229",
          addressCountry: "BD",
        },
        sameAs: [
          "https://www.iccbbg.com",
        ],
      },
      {
        "@type": "EventVenue",
        "@id": "https://iccb.com.bd/#venue",
        name: "International Convention City Bashundhara",
        description:
          "South Asia's largest convention centre, featuring 4 convention halls and an expo village with over 10,000 guest capacity.",
        url: "https://iccb.com.bd",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Kuril Bishwa Road, Next to 300 ft. Purbachal Express Highway",
          addressLocality: "Dhaka",
          postalCode: "1229",
          addressCountry: "BD",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 23.8259,
          longitude: 90.4260,
        },
        telephone: "+88-02-41091551",
        maximumAttendeeCapacity: 10000,
      },
      {
        "@type": "WebSite",
        "@id": "https://iccb.com.bd/#website",
        url: "https://iccb.com.bd",
        name: "ICCB — International Convention City Bashundhara",
        inLanguage: ["en", "bn", "ar", "zh"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
