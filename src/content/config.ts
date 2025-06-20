import { z, defineCollection } from "astro:content";

const generalCollection = defineCollection({
	schema: z.object({
		title: z.string().optional(),
		locale: z.string(),
		summary: z.string().optional(),
	}),
});



export const collections = {
	about: generalCollection,
};
