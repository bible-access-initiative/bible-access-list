import { z, defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const generalCollection = defineCollection({
	schema: z.object({
		title: z.string().optional(),
		locale: z.string(),
		summary: z.string().optional(),
	}),
});

const persecutionLevelSchema = z.enum([
	"extreme",
	"very_strong", 
	"strong",
	"medium",
	"moderate",
	"weak",
	"very_weak"
]);

const persecutionCategorySchema = z.enum([
	"islamic_oppression",
	"religious_nationalism",
	"ethno_religious_hostility",
	"clan_oppression",
	"christian_denominational_oppression",
	"communist_and_post_communist_oppression",
	"secular_intolerance",
	"dictatorial_paranoia",
	"organized_corruption_and_crime"
]);

const persecutionDriverSchema = z.enum([
	"government_officials",
	"ethnic_group_leaders",
	"non_christian_religious_leaders",
	"christian_religious_leaders",
	"violent_religious_groups",
	"normal_citizens",
	"extended_family",
	"political_parties",
	"revolutionaries_or_paramilitary_groups",
	"organized_crime",
	"multilateral_org_and_embassies"
]);

const countryCollection = defineCollection({
	loader: glob({
		generateId: ({ entry }) => entry.replace(/\.md$/, ''),
		pattern: "**/*.md",
		base: "./src/content/countries"
	}),
	schema: z.object({
	  locale: z.string(),
	  title: z.string(),
	  subtitle: z.string().optional().nullable(),
	  persecution_drivers: z.object({
		engines: z.object({
			level: z.record(persecutionCategorySchema, persecutionLevelSchema).optional()
		}).optional(),
		drivers: z.record(
			persecutionDriverSchema,
			z.record(persecutionCategorySchema, persecutionLevelSchema).optional()
		).optional()
	  }).optional()
	}),
  });

export const collections = {
	about: generalCollection,
	countries: countryCollection,
};