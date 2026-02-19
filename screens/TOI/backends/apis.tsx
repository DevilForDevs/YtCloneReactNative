

export async function getFeeds(url: string): Promise<Section[]> {
    const scrappedSections: Section[] = []
    const schema = {
        sections: [
            {
                "name": "englishNewspapers",

                "selector": "tbody:contains(English ePaper)",

                "items": {
                    "selector": "tr:has(a.wptb-link-target) td",

                    "fields": {
                        "title": {
                            "selector": "div.wptb-text-container p",
                            "attr": "text"
                        },
                        "url": {
                            "selector": "a.wptb-link-target",
                            "attr": "href"
                        }
                    }
                }
            },
            {
                "name": "hindinewspaper",

                "selector": "tbody:contains(Hindi ePaper)",

                "items": {
                    "selector": "tr:has(a.wptb-link-target) td",

                    "fields": {
                        "title": {
                            "selector": "div.wptb-text-container p",
                            "attr": "text"
                        },
                        "url": {
                            "selector": "a.wptb-link-target",
                            "attr": "href"
                        }
                    }
                }
            }
        ]
    };

    const res = await fetch("http://192.168.31.68:8080/htmlExtractor", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url,
            schema,
        }),
    });

    const jsonString = await res.text();
    const data = JSON.parse(jsonString);

    if (data.sections.englishNewspapers) {
        const sectionItems: sectionItem[] = []
        for (const item of data.sections.englishNewspapers.items) {
            sectionItems.push({
                label: item.title,
                value: item.url
            })
        }
        scrappedSections.push({
            title: "English ePaper in PDF",
            items: sectionItems
        })

    }

    if (data.sections.hindinewspaper) {
        const sectionItems: sectionItem[] = []
        for (const item of data.sections.hindinewspaper.items) {
            sectionItems.push({
                label: item.title,
                value: item.url
            })
        }


        scrappedSections.push({
            title: "Hindi ePaper in PDF",
            items: sectionItems
        })


    }

    return scrappedSections

}

export const TOI_CITY_MAP: Record<string, string> = {
    cap: "Delhi",
    toigo: "Goa",
    toiac: "Ahmedabad",
    toibgc: "Bengaluru",
    toibhoc: "Bhubaneswar",
    toicgct: "Chandigarh",
    toich: "Chennai",
    toih: "Hyderabad",
    toijc: "Jaipur",
    toikrko: "Kolkata",
    toikc: "Kochi",
    toilc: "Lucknow",
    toim: "Mumbai",
    toipuc: "Pune"
};

export async function getNewsPapers(): Promise<Section[]> {
    const scrappedSections: Section[] = []



    const citiesTheHindu: string[] = [
        "International", "Bengaluru", "Chennai", "Coimbatore",
        "Cuttack", "Delhi", "Erode", "Hubli", "Hyderabad",
        "Kochi", "Kolkata", "Kozhikode", "Lucknow",
        "Madurai", "Mangaluru", "Mohali", "Mumbai",
        "Patna", "Thiruvananthapuram", "Tiruchirapalli",
        "Vijayawada", "Visakhapatnam"
    ];

    //toi section
    scrappedSections.push({
        title: "Times of India",
        items: Object.entries(TOI_CITY_MAP).map(([code, city]) => ({
            label: city,   // "Delhi"
            value: code    // "cap"
        }))
    });

    // 📰 The Hindu Section
    scrappedSections.push({
        title: "The Hindu",
        items: citiesTheHindu.map(city => ({
            label: city,
            value: `https://www.thehindu.com/news/cities/${city.toLowerCase()}`
        }))
    });

    // 📰 Dainik Jagran Section
    scrappedSections.push({
        title: "Dainik Jagran",
        items: [
            {
                label: "National",
                value: "https://www.jagran.com/"
            }
        ]
    });

    // 📰 Dainik Bhaskar Section
    scrappedSections.push({
        title: "Dainik Bhaskar",
        items: [
            {
                label: "National",
                value: "https://www.bhaskar.com/"
            }
        ]
    });

    return scrappedSections
}