

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

export const editionMap: Record<string, string> = {

    // National (Top Priority)
    "262-National": "National",

    // ===== BIHAR (Primary Focus State) =====

    // Capital
    "84-Patna-Nagar": "Patna Nagar",

    // Major Bihar Cities
    "203-Muzaffarpur-Nagar": "Muzaffarpur Nagar",
    "205-Bhagalpur-City": "Bhagalpur City",
    "92-Gaya": "Gaya",
    "219-Darbhanga": "Darbhanga",
    "93-Ara": "Ara",
    "223-Purnea": "Purnea",

    // Other Important Districts
    "215-Motihari": "Motihari",
    "230-Katihar": "Katihar",
    "231-Khagaria": "Khagaria",
    "274-Gopalganj": "Gopalganj",
    "217-Samstipur": "Samstipur",
    "206-Saharsa": "Saharsa",
    "218-Sitamarhi": "Sitamarhi",
    "94-Vaishali": "Vaishali",
    "91-Begusarai": "Begusarai",
    "85-Biharsarif": "Biharsarif",
    "89-Sasaram": "Sasaram",
    "90-Saran": "Saran",
    "87-Siwan": "Siwan",
    "216-Madhubani": "Madhubani",
    "228-Lakhisarai": "Lakhisarai",
    "232-Banka": "Banka",
    "214-Betiah": "Betiah",
    "224-Kisanganj": "Kisanganj",
    "289-Supaul": "Supaul",
    "297-Madhepura": "Madhepura",
    "292-Bhabhua": "Bhabhua",
    "225-Arraria": "Arraria",
    "88-Jehanabad": "Jehanabad",
    "229-Munger": "Munger",
    "282-NAWADA": "NAWADA",
    "86-Buxer": "Buxer",

    // ===== DELHI =====

    // Main Capital Edition
    "4-Delhi-City": "Delhi City",

    // Delhi Zones
    "298-South-Delhi": "South Delhi",
    "238-East-Delhi": "East Delhi",
    "239-West-Delhi": "West Delhi",
    "240-Outer-Delhi": "Outer Delhi",

    // NCR
    "241-Noida": "Noida"
};

export async function getNewsPapers(): Promise<Section[]> {
    const scrappedSections: Section[] = []

    //toi section
    scrappedSections.push({
        title: "Times of India",
        items: Object.entries(TOI_CITY_MAP).map(([code, city]) => ({
            label: city,   // "Delhi"
            value: code,    // "cap"
            link: "https://epaper.indiatimes.com/"
        }))
    });


    // 📰 Dainik Jagran Section
    scrappedSections.push({
        title: "Dainik Jagran",
        items: Object.entries(editionMap).map(([key, name]) => ({
            label: name,
            value: key,
            link: "https://epaper.jagran.com/"
        }))
    });



    return scrappedSections
}