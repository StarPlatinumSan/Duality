import en from "./en.json";
import fr from "./fr.json";
import { personaDefinitions, type AbilityKind, type PersonaCost, type PersonaSubclass } from "./personas";

export type { AbilityKind, PersonaSubclass } from "./personas";

export type Language = "en" | "fr";
export type View = "menu" | "play" | "rules" | "bestiary" | "credits";
export type BestiarySection = "personas" | "objects" | "reactions" | "synergies";
export type SynergyTone = "synergistic" | "antagonistic";

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
	ultimateAftermath?: string;
	placeholder?: boolean;
};

export type RuleCard = {
	title: string;
	paragraphs: string[];
	points?: { term: string; text: string }[];
	callout?: { title: string; text: string };
	note?: string;
};

export type SynergyPersona = {
	id?: string;
	name: string;
	role: string;
};

export type Synergy = {
	personas: [SynergyPersona, SynergyPersona];
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
		muteMusic: string;
		unmuteMusic: string;
		diceNotation: string;
		diceExplanation: string;
		collection: string;
		close: string;
		personaSheet: string;
		personaSheetFor: string;
		persona: string;
		healthPoints: string;
		hpShort: string;
		tweak: string;
		eyes: string;
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
		playSubtitle: string;
		rules: string;
		rulesSubtitle: string;
		bestiary: string;
		bestiarySubtitle: string;
		credits: string;
		creditsSubtitle: string;
	};
	credits: {
		eyebrow: string;
		title: string;
		paragraphs: string[];
		musicCredit: {
			label: string;
			title: string;
			by: string;
			author: string;
			license: string;
			url: string;
			licenseUrl: string;
		};
		note: string;
		contact: string;
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
		synergyFilters: {
			ariaLabel: string;
			allTypes: string;
			synergistic: string;
			antagonistic: string;
			personaLabel: string;
			allPersonas: string;
			noResults: string;
		};
		personaGroups: { id: PersonaSubclass; label: string; personaIds: string[] }[];
		object: { type: string; badge: string; name: string; description: string };
		reaction: { type: string; badge: string; name: string; description: string };
		synergies: SynergyCategory[];
	};
	personas: Persona[];
};

type LocalizedPersona = {
	id: string;
	abilities: PersonaAbility[];
	ultimateAftermath?: string;
};

type LocalizedGameContent = Omit<GameContent, "bestiary" | "personas"> & {
	bestiary: Omit<GameContent["bestiary"], "personaGroups"> & {
		personaGroups: { id: PersonaSubclass; label: string }[];
	};
	personas: LocalizedPersona[];
};

function formatCost(cost: PersonaCost, content: LocalizedGameContent) {
	const resource = cost.resource === "eyes" ? content.ui.eyes : content.ui.tweak;
	return `${cost.amount} ${resource}`;
}

function createContent(source: LocalizedGameContent): GameContent {
	const localizedPersonas = new Map(source.personas.map((persona) => [persona.id, persona]));

	const personas = personaDefinitions.map((definition): Persona => {
		const localizedPersona = localizedPersonas.get(definition.id);
		if (!localizedPersona) throw new Error(`Missing localized Persona content for ${definition.id} in ${source.language}.`);

		const { classOrder: _classOrder, costs, ...rawPersona } = definition;
		void _classOrder;

		return {
			...rawPersona,
			abilities: localizedPersona.abilities.map((ability) => {
				const cost = costs?.[ability.kind];
				return { ...ability, cost: cost ? formatCost(cost, source) : ability.cost };
			}),
			ultimateAftermath: localizedPersona.ultimateAftermath,
		};
	});

	return {
		...source,
		bestiary: {
			...source.bestiary,
			personaGroups: source.bestiary.personaGroups.map((group) => ({
				...group,
				personaIds: personaDefinitions
					.filter((persona) => persona.subclass === group.id)
					.sort((firstPersona, secondPersona) => firstPersona.classOrder - secondPersona.classOrder)
					.map((persona) => persona.id),
			})),
		},
		personas,
	};
}

export const contentByLanguage: Record<Language, GameContent> = {
	en: createContent(en as unknown as LocalizedGameContent),
	fr: createContent(fr as unknown as LocalizedGameContent),
};
