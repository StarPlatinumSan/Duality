import en from "./en.json";
import fr from "./fr.json";

export type Language = "en" | "fr";
export type View = "menu" | "play" | "rules" | "bestiary";
export type BestiarySection = "personas" | "objects" | "reactions" | "synergies";
export type AbilityKind = "passive" | "ability1" | "ability2" | "ultimate";
export type SynergyTone = "synergistic" | "antagonistic";
export type PersonaSubclass = "tank" | "dps" | "assassin" | "support";

export type PersonaAbilityBlock = {
	label?: string;
	text?: string;
	items?: string[];
	italic?: boolean;
};

export type PersonaAbility = {
	kind: AbilityKind;
	label: string;
	name: string;
	cost?: string;
	blocks: PersonaAbilityBlock[];
};

export type Persona = {
	id: string;
	asset: string;
	name: string;
	subclass: PersonaSubclass;
	health: number | string;
	tweak: number | string;
	abilities: PersonaAbility[];
	becomesInert?: boolean;
	placeholder?: boolean;
};

export type RuleCard = {
	title: string;
	paragraphs: string[];
	points?: { term: string; text: string }[];
	callout?: { title: string; text: string };
	note?: string;
};

export type Synergy = {
	personas: [{ name: string; role: string }, { name: string; role: string }];
	result: string;
	interaction: string;
};

export type SynergyCategory = {
	tone: SynergyTone;
	label: string;
	title: string;
	description: string;
	synergies: Synergy[];
};

export type GameContent = {
	language: Language;
	languageName: string;
	ui: {
		return: string;
		mainMenuAria: string;
		playAria: string;
		playMessage: string;
		ruleSectionsAria: string;
		bestiarySectionsAria: string;
		languageAria: string;
		collection: string;
		close: string;
		personaSheet: string;
		personaSheetFor: string;
		persona: string;
		healthPoints: string;
		hpShort: string;
		tweak: string;
		comingSoon: string;
		personaComingSoon: string;
		viewSheet: string;
		viewPersonaSheet: string;
		portrait: string;
		fullArt: string;
		artworksFor: string;
		afterUltimate: string;
		becomesInert: string;
		staysActive: string;
		fusion: string;
		carryBuff: string;
		supportNerf: string;
	};
	menu: {
		play: string;
		rules: string;
		bestiary: string;
	};
	rules: {
		eyebrow: string;
		title: string;
		sections: {
			cardTypes: { id: string; number: string; title: string; cards: RuleCard[] };
			duoBuilding: {
				id: string;
				number: string;
				title: string;
				intro: string;
				strategies: { label: string; title: string; text: string }[];
			};
			turn: {
				id: string;
				number: string;
				title: string;
				intro: string;
				phases: { number: string; title: string; text: string; items?: string[]; note?: string }[];
			};
			reactions: {
				id: string;
				number: string;
				title: string;
				uses: { label: string; text: string }[];
			};
			lexicon: {
				id: string;
				number: string;
				title: string;
				entries: { term: string; definition: string }[];
			};
		};
	};
	bestiary: {
		eyebrow: string;
		title: string;
		tabs: { id: BestiarySection; label: string }[];
		personaView: { ariaLabel: string; grouped: string; all: string };
		personaGroups: { id: PersonaSubclass; label: string; personaIds: string[] }[];
		object: { type: string; badge: string; name: string; description: string };
		reaction: { type: string; badge: string; name: string; description: string };
		synergies: SynergyCategory[];
	};
	personas: Persona[];
};

export const contentByLanguage: Record<Language, GameContent> = {
	en: en as GameContent,
	fr: fr as GameContent,
};
