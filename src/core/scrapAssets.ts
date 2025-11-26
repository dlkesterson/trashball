import { SCRAP_DEFINITIONS, type Rarity, type ScrapDefinition } from './scrapDefinitions';

const assetUrlMap = import.meta.glob('../assets/*.fbx', {
	eager: true,
	as: 'url',
}) as Record<string, string>;

export type ScrapAsset = ScrapDefinition & {
	assetUrl: string;
};

const SCRAP_ASSETS: ScrapAsset[] = [];
const SCRAP_ASSET_MAP: Record<string, ScrapAsset> = {};

const missingAssets: string[] = [];

for (const definition of SCRAP_DEFINITIONS) {
	const key = `../${definition.assetPath}`;
	const assetUrl = assetUrlMap[key];
	if (!assetUrl) {
		missingAssets.push(definition.id);
		continue;
	}
	const asset = {
		...definition,
		assetUrl,
	};
	SCRAP_ASSETS.push(asset);
	SCRAP_ASSET_MAP[definition.id] = asset;
}

if (missingAssets.length > 0 && import.meta.env.DEV) {
	console.warn(
		'[scrapAssets] Missing FBX asset URLs for:',
		missingAssets.join(', ')
	);
}

export { SCRAP_ASSETS, SCRAP_ASSET_MAP };
export type { Rarity };
