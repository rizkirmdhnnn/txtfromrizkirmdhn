export const defaultWords = {
	projects: "Projects",
	experience: "Experience",
	writing: "Writing",
	about: "About",
	setup: "Setup",
	gallery: "Gallery",
	space: "A personal space",
	contact: "Let’s connect",
	cv: "View CV",
	pinned: "Featured project",
	read: "Explore project",
	article: "Read more",
	demo: "Demo content",
	back: "Back to profile",
	end: "Always building. Always learning.",
	source: "View repository",
	liveDemo: "Live demo",
	close: "Close",
	by: "By",
	updated: "Updated",
	contactSub: "Have an idea, an opportunity, or just want to say hello?",
	cvTitle: "Curriculum vitae",
	downloadPdf: "Download PDF",
	profileLabel: "Profile",
	viewProfilePhoto: "View profile photo",
	selectedWork: "Selected work",
	workIntro: "From the interface to the infrastructure behind it.",
	notebook: "From the notebook",
	browseProjects: "Browse projects",
	projectsEmpty:
		"Projects are being prepared. Check back soon for a closer look at the work.",
	experienceEmpty:
		"Experience details are being prepared. Explore the projects for a closer look at the work.",
	writingEmpty:
		"New writing is on the way. Check back soon for notes from building.",
	aboutEmpty: "More about this personal space is coming soon.",
	setupEmpty:
		"The setup is being documented. Check back soon for the gear and tools in use.",
	galleryEmpty: "Photos are on the way. Check back soon.",
	setupOther: "Other",
	link: "Open link",
	previousPhoto: "Previous photo",
	nextPhoto: "Next photo",
	sectionsEmpty: "More work and stories will be shared here soon.",
	built: "Made with curiosity.",
	unavailable: "Coming soon",
	cvNote:
		"Demo preview based on profile information. A complete CV is coming soon.",
	download: "Download demo PDF",
	projectsLabel: "Open source",
} as const;

export type WordKey = keyof typeof defaultWords;

export function words(overrides: Record<string, string>): Record<WordKey, string> {
	return { ...defaultWords, ...overrides } as Record<WordKey, string>;
}
