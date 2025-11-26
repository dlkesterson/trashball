import rawDefinitions from '../data/generatedScrapDefinitions.json';

export type MaterialType =
	| 'metal'
	| 'plastic'
	| 'food'
	| 'glass'
	| 'paper'
	| 'organic'
	| 'other';

export type SizeClass = 'XS' | 'S' | 'M' | 'L' | 'XL';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type ScrapDefinition = {
	id: string;
	assetPath: string;
	size: {
		width: number;
		height: number;
		depth: number;
	};
	sizeClass: SizeClass;
	approxVolume: number;
	materialType: MaterialType;
	baseColor: { r: number; g: number; b: number };
	shininess: number;
	emissive: boolean;
	density: number;
	mass: number;
	burnEnergy: number;
	scrapValue: number;
	rarity: Rarity;
	smellLevel: number;
	toxicity: number;
};

const SCRAP_DEFINITIONS = rawDefinitions as ScrapDefinition[];

const SCRAP_DEFINITION_MAP = SCRAP_DEFINITIONS.reduce<Record<string, ScrapDefinition>>(
	(acc, def) => {
		acc[def.id] = def;
		return acc;
	},
	{}
);

export { SCRAP_DEFINITIONS, SCRAP_DEFINITION_MAP };
