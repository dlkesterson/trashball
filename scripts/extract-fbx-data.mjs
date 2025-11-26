#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { promises as fs } from 'node:fs';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import {
	Box3,
	Color,
	Texture,
	TextureLoader,
	Vector3,
} from 'three';

// FBXLoader assumes a browser-like runtime for textures. We only care about geometry here,
// so we stub the pieces it expects to keep the parser happy under Node.
if (!globalThis.window) {
	globalThis.window = {
		URL: {
			createObjectURL: () => '',
			revokeObjectURL: () => undefined,
		},
	};
}

TextureLoader.prototype.load = function loadTextureStub(
	url,
	onLoad,
	onProgress,
	onError
) {
	const texture = new Texture();
	texture.name = typeof url === 'string' ? url : '';
	queueMicrotask(() => {
		if (onLoad) onLoad(texture);
	});
	return texture;
};

const originalWarn = console.warn;
console.warn = (...args) => {
	if (
		typeof args[0] === 'string' &&
		args[0].includes('THREE.FBXLoader: unknown material type')
	) {
		return;
	}
	originalWarn(...args);
};
process.on('exit', () => {
	console.warn = originalWarn;
});

/** @typedef {'metal' | 'plastic' | 'food' | 'glass' | 'paper' | 'organic' | 'other'} MaterialType */

const ROOT = process.cwd();
const ASSETS_DIR = path.resolve(ROOT, 'src/assets');
const OUTPUT_PATH = path.resolve(ROOT, 'src/data/generatedScrapDefinitions.json');

const DENSITY_TABLE = {
	metal: 7.5,
	plastic: 1.1,
	food: 0.9,
	glass: 2.5,
	paper: 0.7,
	organic: 0.8,
	other: 1.0,
};

const ENERGY_TABLE = {
	metal: 3.2,
	plastic: 8.0,
	food: 2.0,
	glass: 0.4,
	paper: 3.8,
	organic: 1.5,
	other: 2.2,
};

const VALUE_TABLE = {
	metal: 75,
	plastic: 45,
	food: 28,
	glass: 60,
	paper: 32,
	organic: 24,
	other: 36,
};

const BASE_SMELL = {
	metal: 0.05,
	plastic: 0.12,
	food: 0.7,
	glass: 0.07,
	paper: 0.18,
	organic: 0.6,
	other: 0.2,
};

const BASE_TOXICITY = {
	metal: 0.55,
	plastic: 0.68,
	food: 0.2,
	glass: 0.25,
	paper: 0.18,
	organic: 0.35,
	other: 0.3,
};

const MATERIAL_KEYWORDS = [
	{
		type: 'food',
		keywords: [
			'apple',
			'banana',
			'bread',
			'burger',
			'pizza',
			'taco',
			'chicken',
			'ham',
			'meat',
			'fish',
			'egg',
			'eggplant',
			'aubergine',
			'grape',
			'melon',
			'pasta',
			'soup',
			'sauce',
			'salad',
			'cheese',
			'milk',
			'cookie',
			'donut',
			'sandwich',
			'hot_dog',
			'hotdog',
			'french_fries',
			'fries',
			'fries',
			'toast',
			'waffle',
			'ice_cream',
			'icecream',
			'nugget',
			'bacon',
			'ketchup',
			'mustard',
			'ribs',
			'ramen',
			'nachos',
			'corn',
			'carrot',
			'cucumber',
			'lettuce',
			'tomato',
			'tomate',
			'tissue', // paper goods but usually food spills
			'cupcake',
			'coffee',
			'chocolate',
			'burrito',
			'pancake',
			'spring_roll',
			'popcorn',
			'pretzel',
			'sushi',
			'fryer',
			'soup',
			'bagel',
		],
	},
	{
		type: 'metal',
		keywords: [
			'metal',
			'trashcan',
			'dumpster',
			'shopingcar',
			'shoppingcart',
			'stove',
			'oven',
			'cookware',
			'pot',
			'pan',
			'toaster',
			'kettle',
			'cupboard',
			'cashier',
			'door',
			'table',
		],
	},
	{
		type: 'plastic',
		keywords: [
			'plastic',
			'bottle',
			'bagg',
			'bag',
			'cup',
			'soap',
			'soda',
			'drink',
			'juice',
			'ketchup',
			'mustard',
			'trash',
			'container',
			'tissue',
			'tupper',
		],
	},
	{
		type: 'glass',
		keywords: ['glass', 'glasses', 'jar'],
	},
	{
		type: 'paper',
		keywords: ['paper', 'box', 'bag', 'tissue', 'napkin', 'plate'],
	},
	{
		type: 'organic',
		keywords: ['plant', 'flower', 'mushroom'],
	},
];

const RARITY_OVERRIDES = [
	{ pattern: /(dumpster|shopingcar|refrigerator|frezer|deepfryer|oven)/, rarity: 'legendary' },
	{ pattern: /(door|table|cashier|drinks|shelf)/, rarity: 'rare' },
];

const SMELL_BOOSTERS = [
	{ pattern: /(rotten|spoiled|mold|rancid)/, amount: 0.25 },
	{ pattern: /(fish|seafood)/, amount: 0.2 },
	{ pattern: /(egg|yolk)/, amount: 0.18 },
	{ pattern: /(sauce|soup|broth|ramen)/, amount: 0.12 },
	{ pattern: /(coffee|milk|shake)/, amount: 0.1 },
];

const TOXICITY_BOOSTERS = [
	{ pattern: /(battery|acid|chemical|soap)/, amount: 0.25 },
	{ pattern: /(plastic|poly)/, amount: 0.12 },
	{ pattern: /(rotten|mold|rancid)/, amount: 0.08 },
];

const SIZE_CLASSES = [
	{ class: 'XS', threshold: 0.3 },
	{ class: 'S', threshold: 1 },
	{ class: 'M', threshold: 3.5 },
	{ class: 'L', threshold: 8 },
	{ class: 'XL', threshold: Infinity },
];

const SIZE_TO_RARITY = {
	XS: 'common',
	S: 'common',
	M: 'uncommon',
	L: 'rare',
	XL: 'legendary',
};

const RARITY_DOWNGRADES = [
	{ pattern: /(rotten|spoiled|mold|trash)/, rarity: 'common' },
	{ pattern: /(bottle|cup|tissue|bag)/, rarity: 'common' },
];

const rarityMultipliers = {
	common: 1,
	uncommon: 1.25,
	rare: 1.8,
	legendary: 2.5,
};

const round = (value) => Math.round(value * 10000) / 10000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

async function listFbxFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await listFbxFiles(fullPath)));
		} else if (entry.isFile() && entry.name.toLowerCase().endsWith('.fbx')) {
			files.push(fullPath);
		}
	}
	return files;
}

function bufferToArrayBuffer(buffer) {
	return buffer.buffer.slice(
		buffer.byteOffset,
		buffer.byteOffset + buffer.byteLength
	);
}

async function loadFbx(loader, filePath) {
	const buffer = await fs.readFile(filePath);
	const arrayBuffer = bufferToArrayBuffer(buffer);
	return loader.parse(arrayBuffer, path.dirname(filePath) + path.sep);
}

function inferMaterialType(name, materialNames) {
	const haystack = `${name} ${materialNames.join(' ')}`.toLowerCase();
	for (const { type, keywords } of MATERIAL_KEYWORDS) {
		for (const keyword of keywords) {
			if (haystack.includes(keyword)) {
				return type;
			}
		}
	}
	if (haystack.includes('glass')) return 'glass';
	if (haystack.includes('paper')) return 'paper';
	return 'other';
}

function pickSizeClass(maxDim) {
	for (const entry of SIZE_CLASSES) {
		if (maxDim <= entry.threshold) {
			return entry.class;
		}
	}
	return 'M';
}

function inferRarity(sizeClass, name) {
	const lower = name.toLowerCase();
	for (const override of RARITY_OVERRIDES) {
		if (override.pattern.test(lower)) return override.rarity;
	}
	let rarity = SIZE_TO_RARITY[sizeClass] ?? 'common';
	for (const downgrade of RARITY_DOWNGRADES) {
		if (downgrade.pattern.test(lower)) {
			rarity = downgrade.rarity;
			break;
		}
	}
	return rarity;
}

function scoreSmell(base = 0.2, context = '') {
	let smell = base ?? 0.2;
	const lower = context.toLowerCase();
	for (const boost of SMELL_BOOSTERS) {
		if (boost.pattern.test(lower)) smell += boost.amount;
	}
	return clamp(smell, 0, 1);
}

function scoreToxicity(base = 0.3, context = '') {
	let tox = base ?? 0.3;
	const lower = context.toLowerCase();
	for (const boost of TOXICITY_BOOSTERS) {
		if (boost.pattern.test(lower)) tox += boost.amount;
	}
	return clamp(tox, 0, 1);
}

function extractShininess(material) {
	if (typeof material?.shininess === 'number') {
		return clamp(material.shininess / 100, 0, 1);
	}
	if (typeof material?.roughness === 'number') {
		return clamp(1 - material.roughness, 0, 1);
	}
	if (typeof material?.metalness === 'number') {
		return clamp(0.4 + material.metalness * 0.5, 0, 1);
	}
	return null;
}

function gatherMaterialStats(object3d) {
	const color = new Color(0x808080);
	let r = 0;
	let g = 0;
	let b = 0;
	let samples = 0;
	let shininessSum = 0;
	let shininessSamples = 0;
	let emissive = false;
	const materialNames = new Set();
	object3d.traverse((child) => {
		if (!child.isMesh) return;
		const mesh = child;
		const materials = Array.isArray(mesh.material)
			? mesh.material
			: [mesh.material];
		for (const mat of materials) {
			if (!mat) continue;
			if (mat.name) materialNames.add(mat.name);
			if (mat.color) {
				color.copy(mat.color);
				r += color.r;
				g += color.g;
				b += color.b;
				samples++;
			}
			const shininess = extractShininess(mat);
			if (shininess !== null) {
				shininessSum += shininess;
				shininessSamples++;
			}
			if (mat.emissive && (mat.emissive.r || mat.emissive.g || mat.emissive.b)) {
				emissive = true;
			} else if (typeof mat.emissiveIntensity === 'number' && mat.emissiveIntensity > 0.01) {
				emissive = true;
			}
		}
	});
	const baseColor = samples
		? { r: round(r / samples), g: round(g / samples), b: round(b / samples) }
		: { r: 0.5, g: 0.5, b: 0.5 };
	const shininess =
		shininessSamples > 0 ? round(shininessSum / shininessSamples) : 0.4;
	return { baseColor, shininess, emissive, materialNames: [...materialNames] };
}

function computeDefinition(filePath, object3d) {
	const bbox = new Box3().setFromObject(object3d);
	const size = new Vector3();
	bbox.getSize(size);
	const maxDim = Math.max(size.x, size.y, size.z) || 1;
	const approxVolume = size.x * size.y * size.z;
	const { baseColor, shininess, emissive, materialNames } =
		gatherMaterialStats(object3d);
	const id = path.basename(filePath, path.extname(filePath));
	const relPath = path.relative(path.resolve(ROOT, 'src'), filePath);
	const materialType = inferMaterialType(id, materialNames);
	const density = DENSITY_TABLE[materialType] ?? DENSITY_TABLE.other;
	const mass = approxVolume * density;
	const burnEnergy =
		mass * (ENERGY_TABLE[materialType] ?? ENERGY_TABLE.other);
	const sizeClass = pickSizeClass(maxDim);
	const rarity = inferRarity(sizeClass, id);
	const smellContext = `${id} ${materialNames.join(' ')}`;
	const smellLevel = scoreSmell(BASE_SMELL[materialType], smellContext);
	const toxicity = scoreToxicity(BASE_TOXICITY[materialType], smellContext);
	const scrapValue = Math.round(
		mass *
			(VALUE_TABLE[materialType] ?? VALUE_TABLE.other) *
			(rarityMultipliers[rarity] ?? 1)
	);
	return {
		id,
		assetPath: relPath.replace(/\\/g, '/'),
		size: {
			width: round(size.x),
			height: round(size.y),
			depth: round(size.z),
		},
		sizeClass,
		approxVolume: round(approxVolume),
		materialType,
		baseColor,
		shininess,
		emissive,
		density: round(density),
		mass: round(mass),
		burnEnergy: round(burnEnergy),
		scrapValue,
		rarity,
		smellLevel: round(smellLevel),
		toxicity: round(toxicity),
	};
}

async function main() {
	const loader = new FBXLoader();
	const files = await listFbxFiles(ASSETS_DIR);
	if (files.length === 0) {
		console.warn('No FBX files found in', ASSETS_DIR);
		return;
	}
	const definitions = [];
	for (const file of files) {
		try {
			const object3d = await loadFbx(loader, file);
			const def = computeDefinition(file, object3d);
			definitions.push(def);
			console.log(`✔ Processed ${path.basename(file)}`);
		} catch (err) {
			console.error(`✖ Failed to process ${file}:`, err);
		}
	}
	definitions.sort((a, b) => a.id.localeCompare(b.id));
	await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
	await fs.writeFile(
		OUTPUT_PATH,
		JSON.stringify(definitions, null, 2),
		'utf8'
	);
	console.log(
		`Wrote ${definitions.length} scrap definitions to ${path.relative(
			ROOT,
			OUTPUT_PATH
		)}`
	);
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
