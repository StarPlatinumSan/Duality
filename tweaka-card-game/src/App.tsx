import { Fragment, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { contentByLanguage, type BestiarySection, type GameContent, type Language, type Persona, type RuleCard, type SynergyTone, type View } from "./data/content";
import hitSoundUrl from "./audio/hit.mp3";
import popSoundUrl from "./audio/pop.mp3";
import backgroundMusic from "./music/veritas.mp3";

const HIT_SOUND_VOLUME = 0.32;
const POP_SOUND_VOLUME = 0.2;

type MusicControlProps = {
	musicMuted: boolean;
	onMusicToggle: () => void;
};

function formatName(template: string, name: string) {
	return template.replace("{name}", name);
}

type DiceTooltipPosition = {
	top: number;
	left: number;
	maxWidth: number;
	placement: "above" | "below";
};

function DiceNotation({ count, content }: { count: string; content: GameContent }) {
	const triggerRef = useRef<HTMLSpanElement>(null);
	const tooltipId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const [position, setPosition] = useState<DiceTooltipPosition | null>(null);
	const notation = content.ui.diceNotation.replace("{count}", count);
	const explanation = content.ui.diceExplanation.replace("{count}", count);

	const updatePosition = useCallback(() => {
		const trigger = triggerRef.current;
		if (!trigger) return;

		const rect = trigger.getBoundingClientRect();
		const viewportPadding = 12;
		const maxWidth = Math.min(272, window.innerWidth - viewportPadding * 2);
		const halfWidth = maxWidth / 2;
		const left = Math.min(Math.max(rect.left + rect.width / 2, viewportPadding + halfWidth), window.innerWidth - viewportPadding - halfWidth);
		const placement = rect.top > 110 ? "above" : "below";
		const top = placement === "above" ? rect.top - 8 : rect.bottom + 8;

		setPosition({ top, left, maxWidth, placement });
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const closeWhenClickingAway = (event: PointerEvent) => {
			if (!triggerRef.current?.contains(event.target as Node)) setIsOpen(false);
		};

		updatePosition();
		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);
		document.addEventListener("pointerdown", closeWhenClickingAway, true);

		return () => {
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, true);
			document.removeEventListener("pointerdown", closeWhenClickingAway, true);
		};
	}, [isOpen, updatePosition]);

	const showTooltip = () => {
		updatePosition();
		setIsOpen(true);
	};

	return (
		<>
			<span
				ref={triggerRef}
				className="dice-notation"
				tabIndex={0}
				aria-describedby={isOpen ? tooltipId : undefined}
				onMouseEnter={showTooltip}
				onMouseLeave={() => setIsOpen(false)}
				onFocus={showTooltip}
				onBlur={() => setIsOpen(false)}
				onPointerDown={(event) => {
					if (event.pointerType !== "mouse") {
						updatePosition();
						setIsOpen((current) => !current);
					}
				}}
			>
				{notation}
			</span>

			{isOpen &&
				position &&
				createPortal(
					<span id={tooltipId} className={`dice-tooltip is-${position.placement}`} style={{ top: position.top, left: position.left, maxWidth: position.maxWidth }} role="tooltip">
						{explanation}
					</span>,
					document.body,
				)}
		</>
	);
}

function DiceText({ text, content }: { text: string; content: GameContent }) {
	const matches = [...text.matchAll(/(\d+)\s*d6/gi)];
	if (matches.length === 0) return text;

	const parts: ReactNode[] = [];
	let currentIndex = 0;

	for (const match of matches) {
		const matchIndex = match.index ?? currentIndex;
		const count = match[1];

		if (matchIndex > currentIndex) parts.push(text.slice(currentIndex, matchIndex));

		parts.push(<DiceNotation count={count} content={content} key={`${matchIndex}-${match[0]}`} />);

		currentIndex = matchIndex + match[0].length;
	}

	if (currentIndex < text.length) parts.push(text.slice(currentIndex));

	return <>{parts}</>;
}

function safelyPlay(audio: HTMLAudioElement) {
	void audio.play().catch(() => undefined);
}

function findImpactOffset(buffer: AudioBuffer) {
	const audibleThreshold = 0.012;
	const safetyLeadSamples = Math.round(buffer.sampleRate * 0.004);
	let firstAudibleSample = 0;

	search: for (let sample = 0; sample < buffer.length; sample += 1) {
		for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
			if (Math.abs(buffer.getChannelData(channel)[sample]) >= audibleThreshold) {
				firstAudibleSample = sample;
				break search;
			}
		}
	}

	return Math.max(0, firstAudibleSample - safetyLeadSamples) / buffer.sampleRate;
}

function LanguageToggle({ language, onChange, ariaLabel, className = "" }: { language: Language; onChange: (language: Language) => void; ariaLabel: string; className?: string }) {
	return (
		<div className={`language-toggle${className ? ` ${className}` : ""}`} role="group" aria-label={ariaLabel}>
			<button type="button" className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => onChange("en")}>
				EN
			</button>
			<button type="button" className={language === "fr" ? "active" : ""} aria-pressed={language === "fr"} onClick={() => onChange("fr")}>
				FR
			</button>
		</div>
	);
}

function MusicToggle({ muted, onToggle, content }: { muted: boolean; onToggle: () => void; content: GameContent }) {
	const label = muted ? content.ui.unmuteMusic : content.ui.muteMusic;

	return (
		<button className={`music-toggle${muted ? " is-muted" : ""}`} type="button" aria-label={label} aria-pressed={muted} title={label} onClick={onToggle}>
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
				<path className="music-speaker" d="M4 9h4l5-4v14l-5-4H4V9Z" />
				{muted ? (
					<path className="music-state" d="m17 8 5 4-5 4Z" />
				) : (
					<path className="music-state" d="M17 8v8m4-8v8" />
				)}
			</svg>
		</button>
	);
}

function ScreenHeader({
	onMenu,
	content,
	language,
	onLanguageChange,
	musicMuted,
	onMusicToggle,
	collapsible = false,
	extraAction,
	menuOpen: controlledMenuOpen,
	onMenuOpenChange,
	hideMenuToggle = false,
}: {
	onMenu: () => void;
	content: GameContent;
	language: Language;
	onLanguageChange: (language: Language) => void;
	collapsible?: boolean;
	extraAction?: { label: string; onClick: () => void };
	menuOpen?: boolean;
	onMenuOpenChange?: (open: boolean) => void;
	hideMenuToggle?: boolean;
} & MusicControlProps) {
	const [internalMenuOpen, setInternalMenuOpen] = useState(false);
	const menuOpen = controlledMenuOpen ?? internalMenuOpen;
	const setMenuOpen = (open: boolean) => {
		if (controlledMenuOpen === undefined) setInternalMenuOpen(open);
		onMenuOpenChange?.(open);
	};
	const menuId = useId();

	useEffect(() => {
		if (!menuOpen) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setMenuOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [menuOpen]);

	return (
		<header className={`screen-header${collapsible ? " is-collapsible" : ""}${menuOpen ? " is-menu-open" : ""}`}>
			<button className="header-wordmark" type="button" onClick={onMenu}>
				Duality
			</button>
			{collapsible && <button className="settings-menu-scrim" type="button" tabIndex={menuOpen ? 0 : -1} aria-label={content.ui.closeSettings} onClick={() => setMenuOpen(false)} />}
			{collapsible && !hideMenuToggle && (
				<button className="settings-menu-toggle" type="button" aria-label={menuOpen ? content.ui.closeSettings : content.ui.openSettings} aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen(!menuOpen)}>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<circle cx="12" cy="12" r="3.2" />
						<path d="M12 2.5v2.1M12 19.4v2.1M2.5 12h2.1M19.4 12h2.1M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" />
						<circle cx="12" cy="12" r="7.4" />
					</svg>
				</button>
			)}
			<div className="screen-header-actions" id={menuId} aria-label={collapsible ? content.ui.settings : undefined}>
				<MusicToggle muted={musicMuted} onToggle={onMusicToggle} content={content} />
				<LanguageToggle
					language={language}
					onChange={(nextLanguage) => {
						onLanguageChange(nextLanguage);
						if (collapsible) setMenuOpen(false);
					}}
					ariaLabel={content.ui.languageAria}
				/>
				<button className="menu-return" type="button" onClick={onMenu}>
					{content.ui.return}
				</button>
				{extraAction && (
					<button
						className="header-extra-action"
						type="button"
						onClick={() => {
							setMenuOpen(false);
							extraAction.onClick();
						}}
					>
						{extraAction.label}
					</button>
				)}
			</div>
		</header>
	);
}

function MainMenu({ onSelect, content, language, onLanguageChange, musicMuted, onMusicToggle }: { onSelect: (view: View) => void; content: GameContent; language: Language; onLanguageChange: (language: Language) => void } & MusicControlProps) {
	const [leavingTo, setLeavingTo] = useState<View | null>(null);
	const menuItems: { view: Exclude<View, "menu">; label: string; subtitle: string }[] = [
		{ view: "play", label: content.menu.play, subtitle: content.menu.playSubtitle },
		{ view: "rules", label: content.menu.rules, subtitle: content.menu.rulesSubtitle },
		{ view: "bestiary", label: content.menu.bestiary, subtitle: content.menu.bestiarySubtitle },
		{ view: "credits", label: content.menu.credits, subtitle: content.menu.creditsSubtitle },
	];

	const selectView = (nextView: View) => {
		if (leavingTo) return;

		setLeavingTo(nextView);
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		window.setTimeout(() => onSelect(nextView), reduceMotion ? 0 : 460);
	};

	return (
		<main className={`main-menu screen-enter${leavingTo ? " menu-leaving" : ""}`} aria-busy={Boolean(leavingTo)}>
			<div className="menu-top-controls">
				<MusicToggle muted={musicMuted} onToggle={onMusicToggle} content={content} />
				<LanguageToggle language={language} onChange={onLanguageChange} ariaLabel={content.ui.languageAria} />
			</div>

			<div className="title-stage" aria-labelledby="game-title">
				<span className="title-needle" aria-hidden="true" />
				<h1 id="game-title">Duality</h1>
			</div>

			<nav className="main-actions" aria-label={content.ui.mainMenuAria}>
				{menuItems.map((item) => (
					<button type="button" className={leavingTo === item.view ? "is-selected" : leavingTo ? "is-dimmed" : ""} disabled={Boolean(leavingTo)} onClick={() => selectView(item.view)} key={item.view}>
						<span className="menu-action-copy">
							<strong>{item.label}</strong>
							<small>{item.subtitle}</small>
						</span>
					</button>
				))}
			</nav>
		</main>
	);
}

type PlayerIndex = 0 | 1;
type PlayPhase = "setup" | "battle";
type SelectedTeam = [string | null, string | null];
type SelectedTeams = [SelectedTeam, SelectedTeam];
type BattlePersona = { id: string; currentHp: number; maxHp: number; damageTrailHp: number; hitFlash: number; inert: boolean };
type BattleTeams = [BattlePersona[], BattlePersona[]];
type PendingPlayAction = { kind: "damage"; sourcePlayer: PlayerIndex; sourcePersonaId: string } | { kind: "bind-tenacity"; player: PlayerIndex } | null;
type PendingUltimate = { player: PlayerIndex; sourcePersonaId: string; personaName: string } | null;
type TargetingDrag = {
	pointerId: number;
	sourcePlayer: PlayerIndex;
	sourcePersonaId: string;
	startX: number;
	startY: number;
	currentX: number;
	currentY: number;
	moved: boolean;
	hoveredTarget: { player: PlayerIndex; personaId: string } | null;
};
type TweakOrb = {
	id: number;
	startX: number;
	startY: number;
	deltaX: number;
	deltaY: number;
	delay: number;
	duration: number;
};

function TargetingTrail({ drag }: { drag: TargetingDrag }) {
	return createPortal(
		<svg className="battle-targeting-trail" width="100%" height="100%" aria-hidden="true">
			<line className="battle-targeting-trail-core" x1={drag.startX} y1={drag.startY} x2={drag.currentX} y2={drag.currentY} />
			<circle className="battle-targeting-origin" cx={drag.startX} cy={drag.startY} r="5" />
			<circle className="battle-targeting-reticle" cx={drag.currentX} cy={drag.currentY} r="12" />
			<circle className="battle-targeting-point" cx={drag.currentX} cy={drag.currentY} r="3" />
		</svg>,
		document.body,
	);
}

function TweakOrbLayer({ orbs }: { orbs: TweakOrb[] }) {
	return createPortal(
		<div className="tweak-orb-layer" aria-hidden="true">
			{orbs.map((orb) => {
				const style = {
					left: `${orb.startX}px`,
					top: `${orb.startY}px`,
					"--tweak-orb-x": `${orb.deltaX}px`,
					"--tweak-orb-y": `${orb.deltaY}px`,
					"--tweak-orb-delay": `${orb.delay}ms`,
					"--tweak-orb-duration": `${orb.duration}ms`,
				} as CSSProperties;
				return <span className="tweak-gain-orb" style={style} key={orb.id} />;
			})}
		</div>,
		document.body,
	);
}

function replaceTokens(template: string, tokens: Record<string, string | number>) {
	return Object.entries(tokens).reduce((result, [token, value]) => result.replaceAll(`{${token}}`, String(value)), template);
}

function getAbilityCost(persona: Persona, kind: "ability1" | "ability2" | "ultimate") {
	const cost = persona.abilities.find((ability) => ability.kind === kind)?.cost;
	if (!cost) return "0";
	return cost.match(/\d+(?:[.,]\d+)?/)?.[0] ?? "?";
}

function findSynergy(content: GameContent, personaIds: string[]) {
	if (personaIds.length !== 2) return null;
	const selectedNames = personaIds.map((personaId) => content.personas.find((persona) => persona.id === personaId)?.name).filter(Boolean) as string[];

	for (const category of content.bestiary.synergies) {
		const synergy = category.synergies.find((entry) => selectedNames.every((name) => entry.personas.some((persona) => persona.name === name)));
		if (synergy) return { category, synergy };
	}

	return null;
}

function Play({ onMenu, content, language, onLanguageChange, musicMuted, onMusicToggle }: { onMenu: () => void; content: GameContent; language: Language; onLanguageChange: (language: Language) => void } & MusicControlProps) {
	const [phase, setPhase] = useState<PlayPhase>("setup");
	const [activePicker, setActivePicker] = useState<PlayerIndex>(0);
	const [personaPicker, setPersonaPicker] = useState<{ player: PlayerIndex; slot: number } | null>(null);
	const [selectedTeams, setSelectedTeams] = useState<SelectedTeams>([
		[null, null],
		[null, null],
	]);
	const [battleTeams, setBattleTeams] = useState<BattleTeams | null>(null);
	const [activePlayer, setActivePlayer] = useState<PlayerIndex>(0);
	const [turnNumber, setTurnNumber] = useState(1);
	const [tweakPools, setTweakPools] = useState<[number, number]>([0, 0]);
	const [openPlayerPanel, setOpenPlayerPanel] = useState<{ player: PlayerIndex; kind: "reactions" | "objects" } | null>(null);
	const [selectedReactionSlot, setSelectedReactionSlot] = useState<{ player: PlayerIndex; slot: number } | null>(null);
	const [pendingAction, setPendingAction] = useState<PendingPlayAction>(null);
	const [tenacityBindings, setTenacityBindings] = useState<[string | null, string | null]>([null, null]);
	const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
	const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
	const [targetingDrag, setTargetingDrag] = useState<TargetingDrag | null>(null);
	const [hoveredBattleTarget, setHoveredBattleTarget] = useState<{ player: PlayerIndex; personaId: string } | null>(null);
	const [pendingUltimate, setPendingUltimate] = useState<PendingUltimate>(null);
	const [tweakOrbs, setTweakOrbs] = useState<TweakOrb[]>([]);
	const [tweakGainPlayer, setTweakGainPlayer] = useState<PlayerIndex | null>(null);
	const [fullArtAvailability, setFullArtAvailability] = useState<Record<string, boolean>>({});
	const [fullArtChoices, setFullArtChoices] = useState<Record<string, boolean>>({});
	const damageTrailTimers = useRef<Record<string, number>>({});
	const hitFlashTimers = useRef<Record<string, number>>({});
	const tweakOrbTimerRef = useRef<number | null>(null);
	const tweakOrbSequenceRef = useRef(0);
	const hitAudioContextRef = useRef<AudioContext | null>(null);
	const hitAudioBufferRef = useRef<AudioBuffer | null>(null);
	const hitAudioOffsetRef = useRef(0);
	const hitAudioLoadRef = useRef<Promise<void> | null>(null);
	const hitFallbackAudioRef = useRef<HTMLAudioElement | null>(null);
	const popAudioBufferRef = useRef<AudioBuffer | null>(null);
	const popAudioOffsetRef = useRef(0);
	const popAudioLoadRef = useRef<Promise<void> | null>(null);
	const popFallbackAudioRef = useRef<HTMLAudioElement | null>(null);
	const popArrivalTimersRef = useRef<number[]>([]);
	const popScheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
	const targetingDragRef = useRef<TargetingDrag | null>(null);
	const suppressTargetClickRef = useRef(false);
	const selectedPersona = selectedPersonaId ? (content.personas.find((persona) => persona.id === selectedPersonaId) ?? null) : null;
	const playerLabels: [string, string] = [content.playtest.playerOne, content.playtest.playerTwo];

	const prepareHitSound = useCallback(() => {
		if (hitAudioBufferRef.current) return Promise.resolve();
		if (hitAudioLoadRef.current) return hitAudioLoadRef.current;

		hitAudioLoadRef.current = (async () => {
			const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!AudioContextConstructor) return;

			const context = hitAudioContextRef.current ?? new AudioContextConstructor({ latencyHint: "interactive" });
			hitAudioContextRef.current = context;
			const response = await fetch(hitSoundUrl);
			if (!response.ok) throw new Error(`Unable to load hit sound: ${response.status}`);
			const buffer = await context.decodeAudioData(await response.arrayBuffer());
			hitAudioBufferRef.current = buffer;
			hitAudioOffsetRef.current = findImpactOffset(buffer);
		})().catch(() => undefined);

		return hitAudioLoadRef.current;
	}, []);

	const playHitSound = useCallback(() => {
		const context = hitAudioContextRef.current;
		const buffer = hitAudioBufferRef.current;
		if (context && buffer && context.state === "running") {
			const source = context.createBufferSource();
			const gain = context.createGain();
			source.buffer = buffer;
			gain.gain.value = HIT_SOUND_VOLUME;
			source.connect(gain);
			gain.connect(context.destination);
			source.start(0, hitAudioOffsetRef.current);
			return;
		}
		if (context?.state === "suspended") void context.resume();

		const fallback = hitFallbackAudioRef.current;
		if (fallback) {
			fallback.pause();
			try {
				fallback.currentTime = hitAudioOffsetRef.current;
			} catch {
				fallback.currentTime = 0;
			}
			safelyPlay(fallback);
		}
		void prepareHitSound();
	}, [prepareHitSound]);

	const preparePopSound = useCallback(() => {
		if (popAudioBufferRef.current) return Promise.resolve();
		if (popAudioLoadRef.current) return popAudioLoadRef.current;

		popAudioLoadRef.current = (async () => {
			const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!AudioContextConstructor) return;

			const context = hitAudioContextRef.current ?? new AudioContextConstructor({ latencyHint: "interactive" });
			hitAudioContextRef.current = context;
			const response = await fetch(popSoundUrl);
			if (!response.ok) throw new Error(`Unable to load pop sound: ${response.status}`);
			const buffer = await context.decodeAudioData(await response.arrayBuffer());
			popAudioBufferRef.current = buffer;
			popAudioOffsetRef.current = findImpactOffset(buffer);
		})().catch(() => undefined);

		return popAudioLoadRef.current;
	}, []);

	const clearScheduledPopSounds = useCallback(() => {
		popArrivalTimersRef.current.forEach((timer) => window.clearTimeout(timer));
		popArrivalTimersRef.current = [];
		popScheduledSourcesRef.current.forEach((source) => {
			try {
				source.stop();
			} catch {
				// The source already finished naturally.
			}
		});
		popScheduledSourcesRef.current = [];
	}, []);

	const schedulePopSounds = useCallback(
		(orbs: TweakOrb[]) => {
			clearScheduledPopSounds();
			const context = hitAudioContextRef.current;
			const buffer = popAudioBufferRef.current;

			if (context && buffer && context.state === "running") {
				const startTime = context.currentTime;
				orbs.forEach((orb) => {
					const source = context.createBufferSource();
					const gain = context.createGain();
					source.buffer = buffer;
					gain.gain.value = POP_SOUND_VOLUME;
					source.connect(gain);
					gain.connect(context.destination);
					source.start(startTime + (orb.delay + orb.duration) / 1000, popAudioOffsetRef.current);
					popScheduledSourcesRef.current.push(source);
					source.onended = () => {
						popScheduledSourcesRef.current = popScheduledSourcesRef.current.filter((entry) => entry !== source);
					};
				});
				return;
			}

			if (context?.state === "suspended") void context.resume();
			orbs.forEach((orb) => {
				const timer = window.setTimeout(() => {
					const template = popFallbackAudioRef.current;
					if (!template) return;
					const audio = template.cloneNode(true) as HTMLAudioElement;
					audio.volume = POP_SOUND_VOLUME;
					try {
						audio.currentTime = popAudioOffsetRef.current;
					} catch {
						audio.currentTime = 0;
					}
					safelyPlay(audio);
				}, orb.delay + orb.duration);
				popArrivalTimersRef.current.push(timer);
			});
			void preparePopSound();
		},
		[clearScheduledPopSounds, preparePopSound],
	);

	useEffect(() => {
		if (!selectedPersonaId) return;
		const previousOverflow = document.body.style.overflow;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSelectedPersonaId(null);
		};
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", closeOnEscape);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [selectedPersonaId]);

	useEffect(() => {
		if (!pendingUltimate) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setPendingUltimate(null);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [pendingUltimate]);

	useEffect(() => {
		if (!personaPicker) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !selectedPersonaId) setPersonaPicker(null);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [personaPicker, selectedPersonaId]);

	useEffect(() => {
		const fallback = new Audio(hitSoundUrl);
		fallback.preload = "auto";
		fallback.volume = HIT_SOUND_VOLUME;
		fallback.load();
		hitFallbackAudioRef.current = fallback;
		const popFallback = new Audio(popSoundUrl);
		popFallback.preload = "auto";
		popFallback.volume = POP_SOUND_VOLUME;
		popFallback.load();
		popFallbackAudioRef.current = popFallback;
		void prepareHitSound();
		void preparePopSound();

		const unlockHitAudio = () => {
			void prepareHitSound();
			void preparePopSound();
			const context = hitAudioContextRef.current;
			if (context?.state === "suspended") void context.resume();
		};

		window.addEventListener("pointerdown", unlockHitAudio, { capture: true, once: true });
		window.addEventListener("keydown", unlockHitAudio, { capture: true, once: true });

		return () => {
			window.removeEventListener("pointerdown", unlockHitAudio, true);
			window.removeEventListener("keydown", unlockHitAudio, true);
			fallback.pause();
			hitFallbackAudioRef.current = null;
			popFallback.pause();
			popFallbackAudioRef.current = null;
			clearScheduledPopSounds();
			const context = hitAudioContextRef.current;
			if (context && context.state !== "closed") void context.close();
			hitAudioContextRef.current = null;
			hitAudioBufferRef.current = null;
			hitAudioLoadRef.current = null;
			popAudioBufferRef.current = null;
			popAudioLoadRef.current = null;
		};
	}, [clearScheduledPopSounds, prepareHitSound, preparePopSound]);

	useEffect(() => {
		if (tweakOrbs.length === 0) return;
		schedulePopSounds(tweakOrbs);
	}, [schedulePopSounds, tweakOrbs]);

	useEffect(
		() => () => {
			Object.values(damageTrailTimers.current).forEach((timer) => window.clearTimeout(timer));
			Object.values(hitFlashTimers.current).forEach((timer) => window.clearTimeout(timer));
			if (tweakOrbTimerRef.current !== null) window.clearTimeout(tweakOrbTimerRef.current);
		},
		[],
	);

	const togglePersona = (persona: Persona) => {
		if (persona.placeholder) return;
		setSelectedTeams((current) => {
			const next: SelectedTeams = [[...current[0]], [...current[1]]];
			const selected = next[activePicker];
			const selectedIndex = selected.indexOf(persona.id);
			if (selectedIndex >= 0) selected[selectedIndex] = null;
			else {
				const emptySlot = selected.indexOf(null);
				if (emptySlot >= 0) selected[emptySlot] = persona.id;
			}
			return next;
		});
	};

	const openPersonaPicker = (player: PlayerIndex, slot: number) => {
		setActivePicker(player);
		if (window.matchMedia("(max-width: 680px)").matches) setPersonaPicker({ player, slot });
		else setPersonaPicker(null);
	};

	const selectPersonaForSlot = (persona: Persona) => {
		if (!personaPicker || persona.placeholder) return;
		setSelectedTeams((current) => {
			const next: SelectedTeams = [[...current[0]], [...current[1]]];
			const team = next[personaPicker.player];
			const existingIndex = team.indexOf(persona.id);
			if (existingIndex >= 0 && existingIndex !== personaPicker.slot) {
				[team[existingIndex], team[personaPicker.slot]] = [team[personaPicker.slot], team[existingIndex]];
			} else team[personaPicker.slot] = persona.id;
			return next;
		});
		setPersonaPicker(null);
	};

	const startBattle = () => {
		if (!selectedTeams.every((team) => team.every(Boolean))) return;
		const teams = selectedTeams.map((team) =>
			team
				.filter((personaId): personaId is string => Boolean(personaId))
				.map((personaId) => {
					const persona = content.personas.find((entry) => entry.id === personaId);
					const maxHp = Math.max(1, Number(persona?.health) || 1);
					return { id: personaId, currentHp: maxHp, maxHp, damageTrailHp: maxHp, hitFlash: 0, inert: false };
				}),
		) as BattleTeams;
		setBattleTeams(teams);
		const generatedTweak = selectedTeams.map((team) => team.reduce((total, personaId) => total + (Number(content.personas.find((persona) => persona.id === personaId)?.tweak) || 0), 0)) as [number, number];
		setTweakPools([generatedTweak[0], 0]);
		setActivePlayer(0);
		setTurnNumber(1);
		setOpenPlayerPanel(null);
		setSelectedReactionSlot(null);
		setPendingAction(null);
		setTenacityBindings([null, null]);
		setPendingUltimate(null);
		setPersonaPicker(null);
		targetingDragRef.current = null;
		setTargetingDrag(null);
		setPhase("battle");
	};

	const queueDamageTrail = (player: PlayerIndex, personaId: string) => {
		const timerKey = `${player}:${personaId}`;
		const existingTimer = damageTrailTimers.current[timerKey];
		if (existingTimer) window.clearTimeout(existingTimer);

		damageTrailTimers.current[timerKey] = window.setTimeout(() => {
			setBattleTeams((current) => {
				if (!current) return current;
				const next = current.map((team) => team.map((persona) => ({ ...persona }))) as BattleTeams;
				const target = next[player].find((persona) => persona.id === personaId);
				if (target) target.damageTrailHp = target.currentHp;
				return next;
			});
			delete damageTrailTimers.current[timerKey];
		}, 850);
	};

	const queueHitFlash = (player: PlayerIndex, personaId: string) => {
		const timerKey = `${player}:${personaId}`;
		const existingTimer = hitFlashTimers.current[timerKey];
		if (existingTimer) window.clearTimeout(existingTimer);

		hitFlashTimers.current[timerKey] = window.setTimeout(() => {
			setBattleTeams((current) => {
				if (!current) return current;
				const next = current.map((team) => team.map((persona) => ({ ...persona }))) as BattleTeams;
				const target = next[player].find((persona) => persona.id === personaId);
				if (target) target.hitFlash = 0;
				return next;
			});
			delete hitFlashTimers.current[timerKey];
		}, 190);
	};

	const damagePersona = (player: PlayerIndex, personaId: string, damage: number) => {
		playHitSound();
		setBattleTeams((current) => {
			if (!current) return current;
			const next = current.map((team) => team.map((persona) => ({ ...persona }))) as BattleTeams;
			const target = next[player].find((persona) => persona.id === personaId);
			if (target) {
				target.damageTrailHp = Math.max(target.damageTrailHp, target.currentHp);
				target.currentHp = Math.max(0, target.currentHp - damage);
				target.hitFlash += 1;
			}
			return next;
		});
		queueDamageTrail(player, personaId);
		queueHitFlash(player, personaId);
	};

	const damageTeam = (player: PlayerIndex, damage: number) => {
		playHitSound();
		setBattleTeams((current) => {
			if (!current) return current;
			const next = current.map((team) => team.map((persona) => ({ ...persona }))) as BattleTeams;
			next[player].forEach((persona) => {
				persona.damageTrailHp = Math.max(persona.damageTrailHp, persona.currentHp);
				persona.currentHp = Math.max(0, persona.currentHp - damage);
				persona.hitFlash += 1;
			});
			return next;
		});
		battleTeams?.[player].forEach((persona) => {
			queueDamageTrail(player, persona.id);
			queueHitFlash(player, persona.id);
		});
	};

	const beginTargetingDrag = (event: ReactPointerEvent<HTMLButtonElement>, sourcePlayer: PlayerIndex, sourcePersonaId: string) => {
		if (event.pointerType === "mouse" && event.button !== 0) return;
		const bounds = event.currentTarget.getBoundingClientRect();
		const drag: TargetingDrag = {
			pointerId: event.pointerId,
			sourcePlayer,
			sourcePersonaId,
			startX: bounds.left + bounds.width / 2,
			startY: bounds.top + bounds.height / 2,
			currentX: event.clientX,
			currentY: event.clientY,
			moved: false,
			hoveredTarget: null,
		};
		suppressTargetClickRef.current = false;
		targetingDragRef.current = drag;
		setTargetingDrag(drag);
		setHoveredBattleTarget(null);
		setPendingAction(null);
		setOpenPlayerPanel(null);
	};

	useEffect(() => {
		const findTarget = (clientX: number, clientY: number, sourcePlayer: PlayerIndex) => {
			const card = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-battle-player][data-battle-persona]");
			if (!card) return null;
			const player = Number(card.dataset.battlePlayer);
			const personaId = card.dataset.battlePersona;
			if ((player !== 0 && player !== 1) || !personaId || player === sourcePlayer) return null;
			return { player: player as PlayerIndex, personaId };
		};

		const moveTargetingTrail = (event: PointerEvent) => {
			const drag = targetingDragRef.current;
			if (!drag || event.pointerId !== drag.pointerId) return;
			event.preventDefault();
			const moved = drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6;
			const next = {
				...drag,
				currentX: event.clientX,
				currentY: event.clientY,
				moved,
				hoveredTarget: findTarget(event.clientX, event.clientY, drag.sourcePlayer),
			};
			targetingDragRef.current = next;
			setTargetingDrag(next);
		};

		const finishTargeting = (event: PointerEvent, cancelled = false) => {
			const drag = targetingDragRef.current;
			if (!drag || event.pointerId !== drag.pointerId) return;
			const target = cancelled ? null : findTarget(event.clientX, event.clientY, drag.sourcePlayer);
			if (drag.moved) {
				suppressTargetClickRef.current = true;
				window.setTimeout(() => {
					suppressTargetClickRef.current = false;
				}, 0);
				if (target) damagePersona(target.player, target.personaId, 25);
				setPendingAction(null);
			}
			targetingDragRef.current = null;
			setTargetingDrag(null);
		};

		const cancelTargeting = (event: PointerEvent) => finishTargeting(event, true);
		window.addEventListener("pointermove", moveTargetingTrail, { passive: false });
		window.addEventListener("pointerup", finishTargeting);
		window.addEventListener("pointercancel", cancelTargeting);
		return () => {
			window.removeEventListener("pointermove", moveTargetingTrail);
			window.removeEventListener("pointerup", finishTargeting);
			window.removeEventListener("pointercancel", cancelTargeting);
		};
	}, []);

	const resolvePersonaSelection = (player: PlayerIndex, personaId: string) => {
		if (pendingAction?.kind === "damage") {
			if (player === pendingAction.sourcePlayer) return;
			damagePersona(player, personaId, 25);
			setHoveredBattleTarget(null);
			setPendingAction(null);
			return;
		}
		if (pendingAction?.kind === "bind-tenacity") {
			if (player !== pendingAction.player) return;
			setTenacityBindings((current) => {
				const next: [string | null, string | null] = [...current];
				next[player] = personaId;
				return next;
			});
			setPendingAction(null);
			return;
		}
		setSelectedPersonaId(personaId);
	};

	const requestUltimate = (player: PlayerIndex, source: BattlePersona, persona: Persona) => {
		setPendingAction(null);
		setOpenPlayerPanel(null);
		setPendingUltimate({ player, sourcePersonaId: source.id, personaName: persona.name });
	};

	const confirmUltimate = () => {
		if (!pendingUltimate) return;
		damageTeam(pendingUltimate.player === 0 ? 1 : 0, 40);
		setBattleTeams((current) => {
			if (!current) return current;
			const next = current.map((team) => team.map((entry) => ({ ...entry }))) as BattleTeams;
			const actingPersona = next[pendingUltimate.player].find((entry) => entry.id === pendingUltimate.sourcePersonaId);
			if (actingPersona) actingPersona.inert = true;
			return next;
		});
		setPendingUltimate(null);
	};

	const resetBattle = () => {
		Object.values(damageTrailTimers.current).forEach((timer) => window.clearTimeout(timer));
		damageTrailTimers.current = {};
		Object.values(hitFlashTimers.current).forEach((timer) => window.clearTimeout(timer));
		hitFlashTimers.current = {};
		if (tweakOrbTimerRef.current !== null) window.clearTimeout(tweakOrbTimerRef.current);
		tweakOrbTimerRef.current = null;
		clearScheduledPopSounds();
		setTweakOrbs([]);
		setTweakGainPlayer(null);
		setPhase("setup");
		setActivePicker(0);
		setBattleTeams(null);
		setTweakPools([0, 0]);
		setOpenPlayerPanel(null);
		setSelectedReactionSlot(null);
		setPendingAction(null);
		setSettingsMenuOpen(false);
		setPendingUltimate(null);
		targetingDragRef.current = null;
		setTargetingDrag(null);
	};

	const animateTweakGain = (player: PlayerIndex) => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const target = document.querySelector<HTMLElement>(`.battle-team-zone.is-player-${player + 1} .battle-tweak-counter`);
		if (!target) return;

		const targetBounds = target.getBoundingClientRect();
		const targetX = targetBounds.left + targetBounds.width / 2;
		const targetY = targetBounds.top + targetBounds.height / 2;
		const orbs: TweakOrb[] = [];

		selectedTeams[player].forEach((personaId, personaIndex) => {
			if (!personaId) return;
			const persona = content.personas.find((entry) => entry.id === personaId);
			const production = Math.max(0, Math.floor(Number(persona?.tweak) || 0));
			const source = document.querySelector<HTMLElement>(`[data-battle-player="${player}"][data-battle-persona="${personaId}"] .battle-persona-tweak`);
			if (!source || production === 0) return;

			const sourceBounds = source.getBoundingClientRect();
			const sourceX = sourceBounds.left + sourceBounds.width / 2;
			const sourceY = sourceBounds.top + sourceBounds.height / 2;
			for (let orbIndex = 0; orbIndex < production; orbIndex += 1) {
				const spread = (orbIndex - (production - 1) / 2) * 1.5;
				const destinationSpread = ((orbIndex + personaIndex) % 3 - 1) * 2.5;
				orbs.push({
					id: ++tweakOrbSequenceRef.current,
					startX: sourceX + spread,
					startY: sourceY,
					deltaX: targetX + destinationSpread - sourceX - spread,
					deltaY: targetY - sourceY,
					delay: personaIndex * 65 + orbIndex * 55,
					duration: 560 + (orbIndex % 2) * 45,
				});
			}
		});

		if (orbs.length === 0) return;
		if (tweakOrbTimerRef.current !== null) window.clearTimeout(tweakOrbTimerRef.current);
		setTweakOrbs(orbs);
		setTweakGainPlayer(player);
		const animationLength = Math.max(...orbs.map((orb) => orb.delay + orb.duration)) + 100;
		tweakOrbTimerRef.current = window.setTimeout(() => {
			setTweakOrbs([]);
			setTweakGainPlayer(null);
			tweakOrbTimerRef.current = null;
		}, animationLength);
	};

	const endTurn = () => {
		const nextPlayer: PlayerIndex = activePlayer === 0 ? 1 : 0;
		const generatedTweak = selectedTeams[nextPlayer].reduce((total, personaId) => total + (Number(content.personas.find((persona) => persona.id === personaId)?.tweak) || 0), 0);
		animateTweakGain(nextPlayer);
		setTweakPools((current) => {
			const next: [number, number] = [...current];
			next[nextPlayer] += generatedTweak;
			return next;
		});
		setPendingAction(null);
		setOpenPlayerPanel(null);
		setPendingUltimate(null);
		targetingDragRef.current = null;
		setTargetingDrag(null);
		setActivePlayer(nextPlayer);
		setTurnNumber((current) => current + 1);
	};

	return (
		<div className={`page-view play-view screen-enter${phase === "battle" ? " is-battle-active" : ""}`}>
			<ScreenHeader
				onMenu={onMenu}
				content={content}
				language={language}
				onLanguageChange={onLanguageChange}
				musicMuted={musicMuted}
				onMusicToggle={onMusicToggle}
				collapsible={phase === "battle"}
				extraAction={phase === "battle" ? { label: content.playtest.resetMatch, onClick: resetBattle } : undefined}
				menuOpen={phase === "battle" ? settingsMenuOpen : undefined}
				onMenuOpenChange={setSettingsMenuOpen}
				hideMenuToggle={phase === "battle"}
			/>

			{phase === "setup" ? (
				<main className="play-setup" aria-label={content.ui.playAria}>
					<header className="playtest-title">
						<span>{content.playtest.setupEyebrow}</span>
						<h2>{content.playtest.setupTitle}</h2>
						<p>{content.playtest.setupIntro}</p>
					</header>

					<section className="duo-builders" aria-label={content.playtest.setupTitle}>
						{([0, 1] as PlayerIndex[]).map((player) => {
							const selectedPersonaIds = selectedTeams[player].filter((personaId): personaId is string => Boolean(personaId));
							const synergy = findSynergy(content, selectedPersonaIds);
							return (
								<article className={`duo-builder${activePicker === player ? " is-active" : ""}`} key={player}>
									<button className="duo-builder-select" type="button" onClick={() => setActivePicker(player)}>
										<span>{playerLabels[player]}</span>
										<small>{replaceTokens(content.playtest.selectionCount, { count: selectedPersonaIds.length })}</small>
									</button>
									<div className="duo-builder-slots">
										{[0, 1].map((slot) => {
											const persona = content.personas.find((entry) => entry.id === selectedTeams[player][slot]);
											const hasFullArt = persona ? Boolean(fullArtAvailability[persona.id]) : false;
											const usesFullArt = persona ? hasFullArt && Boolean(fullArtChoices[persona.id]) : false;
											return (
												<div className={`duo-builder-slot${persona ? " is-filled" : ""}${usesFullArt ? " is-full-art" : ""}`} key={slot}>
											<button className="duo-builder-slot-select" type="button" aria-label={`${playerLabels[player]} ${slot + 1}`} onClick={() => openPersonaPicker(player, slot)}>
														{persona ? (
															<>
																<PersonaArtwork name={usesFullArt ? `${persona.asset}FullArt` : persona.asset} className="duo-builder-image" />
																<strong>{persona.name}</strong>
															</>
														) : (
															<span>{slot + 1}</span>
														)}
													</button>
													{persona && (
														<>
															<PersonaArtwork
																name={`${persona.asset}FullArt`}
																className="duo-full-art-probe"
																eager
																onAvailabilityChange={(isAvailable) =>
																	setFullArtAvailability((current) => (current[persona.id] === isAvailable ? current : { ...current, [persona.id]: isAvailable }))
																}
															/>
															<button
																className={`duo-full-art-toggle${usesFullArt ? " is-checked" : ""}`}
																type="button"
																disabled={!hasFullArt}
																aria-pressed={usesFullArt}
																aria-label={`${content.ui.fullArt}: ${persona.name}`}
																title={hasFullArt ? content.ui.fullArt : content.playtest.unavailable}
																onClick={() => setFullArtChoices((current) => ({ ...current, [persona.id]: !current[persona.id] }))}
															>
																<span aria-hidden="true" />
																{content.ui.fullArt}
															</button>
														</>
													)}
												</div>
											);
										})}
									</div>
									<div className={`duo-synergy-status${synergy ? ` is-${synergy.category.tone}` : ""}`}>
										<strong>{synergy ? replaceTokens(content.playtest.synergyFound, { type: synergy.category.label }) : content.playtest.noSynergy}</strong>
										{synergy && <span>{synergy.synergy.personas.map((persona) => persona.name).join(" + ")}</span>}
									</div>
								</article>
							);
						})}
					</section>

					<section className="playtest-roster" aria-label={content.ui.collection}>
						{content.personas.map((persona) => {
							const selectedBy = ([0, 1] as PlayerIndex[]).filter((player) => selectedTeams[player].includes(persona.id));
							const unavailable = Boolean(persona.placeholder);
							return (
								<button
									className={`playtest-roster-card${selectedTeams[activePicker].includes(persona.id) ? " is-selected" : ""}${unavailable ? " is-unavailable" : ""}`}
									type="button"
								disabled={unavailable}
									onClick={() => togglePersona(persona)}
									key={persona.id}
								>
									<div className="playtest-roster-art">
										<PersonaArtwork name={persona.asset} className="playtest-roster-image" />
										<span>{persona.name}</span>
										<div className="roster-selection-marks">
											{selectedBy.map((player) => (
												<b key={player}>P{player + 1}</b>
											))}
										</div>
									</div>
									<div className="playtest-roster-copy">
										<strong>{persona.name}</strong>
										<small>{unavailable ? content.playtest.unavailable : `${persona.health} ${content.ui.hpShort} · ${persona.tweak} ${content.ui.tweak}`}</small>
									</div>
								</button>
							);
						})}
					</section>

					<button className="playtest-start-button" type="button" disabled={!selectedTeams.every((team) => team.every(Boolean))} onClick={startBattle}>
						{content.playtest.startMatch}
					</button>
				</main>
			) : (
				<main className={`playtest-board${pendingAction ? " has-pending-action" : ""}`} aria-label={content.ui.playAria}>
					<header className="battle-status-bar">
						<div>
							<span>{replaceTokens(content.playtest.turn, { turn: turnNumber })}</span>
							<strong>{replaceTokens(content.playtest.activeTurn, { player: playerLabels[activePlayer] })}</strong>
						</div>
						<span className="unlimited-time">{content.playtest.unlimitedTime}</span>
						<button type="button" onClick={resetBattle}>
							{content.playtest.resetMatch}
						</button>
					</header>

					{pendingAction && (
						<div className="battle-action-prompt" role="status">
							<span>
								{pendingAction.kind === "damage"
									? replaceTokens(content.playtest.targetPrompt, { name: content.personas.find((persona) => persona.id === pendingAction.sourcePersonaId)?.name ?? "" })
									: replaceTokens(content.playtest.bindPrompt, { player: playerLabels[pendingAction.player] })}
							</span>
							<button type="button" onClick={() => setPendingAction(null)}>
								{content.playtest.cancel}
							</button>
						</div>
					)}

					<div className="battlefield">
						{([1, 0] as PlayerIndex[]).map((player, zoneIndex) => {
							const opposingPlayer: PlayerIndex = player === 0 ? 1 : 0;
							return (
								<Fragment key={player}>
									<section className={`battle-team-zone is-player-${player + 1}${activePlayer === player ? " is-active" : ""}`}>
									<header className="battle-team-heading">
										<div className="battle-player-label">
											<span>{playerLabels[player]}</span>
										</div>
										<div className="battle-nav-actions">
											<button
												className={`battle-nav-slot is-reactions${openPlayerPanel?.player === player && openPlayerPanel.kind === "reactions" ? " is-active" : ""}`}
												type="button"
												title={content.playtest.reactions}
												aria-label={content.playtest.reactions}
												aria-expanded={openPlayerPanel?.player === player && openPlayerPanel.kind === "reactions"}
												aria-controls={`reaction-rack-${player}`}
												onClick={() => setOpenPlayerPanel((current) => (current?.player === player && current.kind === "reactions" ? null : { player, kind: "reactions" }))}
											>
												<svg viewBox="0 0 24 24" aria-hidden="true">
													<path d="M13.5 2 5 13h6l-1 9 9-13h-6l.5-7Z" />
												</svg>
											</button>
											<button
												className={`battle-nav-slot is-objects${openPlayerPanel?.player === player && openPlayerPanel.kind === "objects" ? " is-active" : ""}`}
												type="button"
												title={content.playtest.objects}
												aria-label={content.playtest.objects}
												aria-expanded={openPlayerPanel?.player === player && openPlayerPanel.kind === "objects"}
												aria-controls={`object-rack-${player}`}
												onClick={() => setOpenPlayerPanel((current) => (current?.player === player && current.kind === "objects" ? null : { player, kind: "objects" }))}
											>
												<svg viewBox="0 0 24 24" aria-hidden="true">
													<path d="M12 2 20 5v6c0 5.1-3.2 8.8-8 11-4.8-2.2-8-5.9-8-11V5l8-3Z" />
													<path d="m8.7 12 2.1 2.1 4.7-5" />
												</svg>
											</button>
										</div>
										<div className={`battle-tweak-counter${tweakGainPlayer === player ? " is-receiving" : ""}`}>
											<span>{content.playtest.tweakPool}:</span>
											<strong>{tweakPools[player]}</strong>
										</div>
										<div className={`battle-card-drawer battle-reaction-rack${openPlayerPanel?.player === player && openPlayerPanel.kind === "reactions" ? " is-open" : ""}`} id={`reaction-rack-${player}`}>
											<strong className="battle-drawer-title">{content.playtest.reactions}</strong>
											<div className="battle-drawer-slots">
												{[0, 1].map((slot) => (
													<button
														className={`battle-reaction-slot${selectedReactionSlot?.player === player && selectedReactionSlot.slot === slot ? " is-selected" : ""}`}
														type="button"
														title={content.playtest.emptyReaction}
														aria-label={`${content.playtest.emptyReaction} ${slot + 1}`}
														onClick={() => setSelectedReactionSlot((current) => (current?.player === player && current.slot === slot ? null : { player, slot }))}
														key={slot}
													>
														{slot + 1}
													</button>
												))}
											</div>
										</div>
										<div className={`battle-card-drawer battle-object-drawer${openPlayerPanel?.player === player && openPlayerPanel.kind === "objects" ? " is-open" : ""}`} id={`object-rack-${player}`}>
											<strong className="battle-drawer-title">{content.playtest.objects}</strong>
											<div className="battle-object-row">
												<button
													className={`battle-object-slot has-object${tenacityBindings[player] ? " is-bound" : ""}`}
													type="button"
													onClick={() => {
														setPendingAction({ kind: "bind-tenacity", player });
														setOpenPlayerPanel(null);
													}}
													title={content.bestiary.object.description}
												>
													<svg viewBox="0 0 24 24" aria-hidden="true">
														<path d="M12 2 20 5v6c0 5.1-3.2 8.8-8 11-4.8-2.2-8-5.9-8-11V5l8-3Z" />
														<path d="m8.7 12 2.1 2.1 4.7-5" />
													</svg>
													<strong>{content.bestiary.object.name}</strong>
													<small>{tenacityBindings[player] ? replaceTokens(content.playtest.boundTo, { name: content.personas.find((persona) => persona.id === tenacityBindings[player])?.name ?? "" }) : content.bestiary.object.description}</small>
												</button>
												{[1, 2].map((slot) => (
													<div className="battle-object-slot" title={content.playtest.emptyObject} key={slot}>
														<span>{slot + 1}</span>
													</div>
												))}
											</div>
										</div>
									</header>
									<div className="battle-team-layout">
										<div className="battle-personas">
											{battleTeams?.[player].map((battlePersona) => {
												const persona = content.personas.find((entry) => entry.id === battlePersona.id);
												if (!persona) return null;
												const usesFullArt = Boolean(fullArtChoices[persona.id] && fullArtAvailability[persona.id]);
												const isDefeated = battlePersona.currentHp <= 0;
												const canAct = activePlayer === player && !battlePersona.inert && !isDefeated;
												const canReceiveTargetDrag = targetingDrag !== null && targetingDrag.sourcePlayer !== player;
												const canReceivePending = canReceiveTargetDrag || (pendingAction?.kind === "damage" && pendingAction.sourcePlayer !== player) || (pendingAction?.kind === "bind-tenacity" && pendingAction.player === player);
												const isAimHovered = targetingDrag?.hoveredTarget?.player === player && targetingDrag.hoveredTarget.personaId === battlePersona.id;
												const isPointerHovered = canReceivePending && hoveredBattleTarget?.player === player && hoveredBattleTarget.personaId === battlePersona.id;
												return (
													<article
													className={`battle-persona${usesFullArt ? " is-full-art" : ""}${activePlayer !== player ? " is-turn-inactive" : ""}${battlePersona.inert ? " is-inert" : ""}${isDefeated ? " is-defeated" : ""}${canReceivePending ? " is-targetable" : ""}${isAimHovered ? " is-aim-hovered" : ""}${isPointerHovered ? " is-target-hovered" : ""}`}
														data-battle-player={player}
														data-battle-persona={battlePersona.id}
														onPointerEnter={() => {
															if (canReceivePending) setHoveredBattleTarget({ player, personaId: battlePersona.id });
														}}
														onPointerLeave={() => setHoveredBattleTarget((current) => (current?.player === player && current.personaId === battlePersona.id ? null : current))}
														key={battlePersona.id}
													>
														{battlePersona.hitFlash > 0 && <span className="battle-card-hit-flash" key={battlePersona.hitFlash} aria-hidden="true" />}
													{usesFullArt && <PersonaArtwork name={`${persona.asset}FullArt`} className="battle-persona-full-art-background" eager />}
														<button className="battle-persona-portrait" type="button" aria-label={replaceTokens(content.playtest.viewKit, { name: persona.name })} onClick={() => resolvePersonaSelection(player, battlePersona.id)}>
														<PersonaArtwork name={usesFullArt ? `${persona.asset}FullArt` : persona.asset} className="battle-persona-image" eager />
															<span className="battle-persona-fallback">{persona.name}</span>
															<span className="battle-persona-tweak" aria-label={`${persona.tweak} ${content.ui.tweak}`}>
																<b>{persona.tweak}</b>
															</span>
															<span className="battle-persona-name">
																<strong>{persona.name}</strong>
																{battlePersona.inert && <b>{content.playtest.inert}</b>}
																{isDefeated && <b>{content.playtest.defeated}</b>}
															</span>
														</button>
														<div className="battle-persona-controls">
															<div className="battle-hp" aria-label={`${battlePersona.currentHp} / ${battlePersona.maxHp} ${content.ui.hpShort}`}>
																<div className="battle-hp-track">
																	<span className="battle-hp-damage" style={{ width: `${(battlePersona.damageTrailHp / battlePersona.maxHp) * 100}%` }} />
																	<span className="battle-hp-current" style={{ width: `${(battlePersona.currentHp / battlePersona.maxHp) * 100}%` }} />
																	<strong>
																		{battlePersona.currentHp} / {battlePersona.maxHp}
																	</strong>
																</div>
															</div>
															<div className="battle-abilities">
																<button
																	className={`is-targeted${targetingDrag?.sourcePlayer === player && targetingDrag.sourcePersonaId === battlePersona.id ? " is-dragging" : ""}`}
																	type="button"
																	disabled={!canAct}
																	title={content.playtest.abilityOneHint}
																	onPointerDown={(event) => beginTargetingDrag(event, player, battlePersona.id)}
																	onClick={() => {
																		if (suppressTargetClickRef.current) return;
																		setHoveredBattleTarget(null);
																		setPendingAction({ kind: "damage", sourcePlayer: player, sourcePersonaId: battlePersona.id });
																	}}
																>
																	<span className="battle-ability-copy">
																		<strong>{content.playtest.abilityOne}</strong>
																	</span>
																	<b className="battle-ability-cost">{getAbilityCost(persona, "ability1")}</b>
																</button>
																<button className="is-area" type="button" disabled={!canAct} title={content.playtest.abilityTwoHint} onClick={() => damageTeam(opposingPlayer, 15)}>
																	<span className="battle-ability-copy">
																		<strong>{content.playtest.abilityTwo}</strong>
																	</span>
																	<b className="battle-ability-cost">{getAbilityCost(persona, "ability2")}</b>
																</button>
																<button className="is-ultimate" type="button" disabled={!canAct} title={content.playtest.ultimateHint} onClick={() => requestUltimate(player, battlePersona, persona)}>
																	<span className="battle-ability-copy">
																		<strong>{content.playtest.ultimate}</strong>
																	</span>
																	<b className="battle-ability-cost">{getAbilityCost(persona, "ultimate")}</b>
																</button>
															</div>
														</div>
													</article>
												);
											})}
										</div>
									</div>

									</section>

									{zoneIndex === 0 && (
										<div className="battle-midline">
											<button
												className={`battle-settings-toggle${settingsMenuOpen ? " is-open" : ""}`}
												type="button"
												aria-label={settingsMenuOpen ? content.ui.closeSettings : content.ui.openSettings}
												aria-expanded={settingsMenuOpen}
												onClick={() => setSettingsMenuOpen((open) => !open)}
											>
											Menu
											</button>
										<strong className="battle-versus" aria-hidden="true">VS</strong>
											<button className="end-turn-button" type="button" onClick={endTurn}>
												{content.playtest.endTurn}
											</button>
										</div>
									)}
								</Fragment>
							);
						})}
					</div>
				</main>
			)}

			{targetingDrag && <TargetingTrail drag={targetingDrag} />}
			{tweakOrbs.length > 0 && <TweakOrbLayer orbs={tweakOrbs} />}

			{personaPicker &&
				createPortal(
					<div
						className="persona-picker-backdrop"
						role="presentation"
						onPointerDown={(event) => {
							if (event.target === event.currentTarget) setPersonaPicker(null);
						}}
					>
						<section className="persona-picker-panel" role="dialog" aria-modal="true" aria-labelledby="persona-picker-title">
							<header className="persona-picker-header">
								<div>
									<span>{playerLabels[personaPicker.player]}</span>
									<h2 id="persona-picker-title">{replaceTokens(content.playtest.selectionCount, { count: selectedTeams[personaPicker.player].filter(Boolean).length })}</h2>
								</div>
								<button type="button" onClick={() => setPersonaPicker(null)}>
									{content.ui.close}
								</button>
							</header>
							<div className="persona-picker-grid">
								{content.personas.map((persona) => {
									const selected = selectedTeams[personaPicker.player].includes(persona.id);
									return (
										<article className={`persona-picker-card${selected ? " is-selected" : ""}`} key={persona.id}>
											<button className="persona-picker-select" type="button" disabled={Boolean(persona.placeholder)} onClick={() => selectPersonaForSlot(persona)}>
												<div className="persona-picker-art">
													<PersonaArtwork name={persona.asset} className="persona-picker-image" />
													<span>{persona.name}</span>
												</div>
												<strong>{persona.name}</strong>
												<span className="persona-picker-subclass">{persona.subclass}</span>
												<small>
													<span>
														{persona.health} {content.ui.hpShort}
													</span>
													<span>
														{persona.tweak} {content.ui.tweak}
													</span>
												</small>
											</button>
											<button className="persona-picker-details" type="button" aria-label={formatName(content.ui.viewPersonaSheet, persona.name)} onClick={() => setSelectedPersonaId(persona.id)}>
												{content.ui.viewSheet}
											</button>
										</article>
									);
								})}
							</div>
						</section>
					</div>,
					document.body,
				)}

			{pendingUltimate &&
				createPortal(
					<div
						className="battle-ultimate-backdrop"
						role="presentation"
						onPointerDown={(event) => {
							if (event.target === event.currentTarget) setPendingUltimate(null);
						}}
					>
						<section className="battle-ultimate-panel" role="dialog" aria-modal="true" aria-labelledby="battle-ultimate-title" aria-describedby="battle-ultimate-description">
							<span className="battle-ultimate-kicker">{content.playtest.ultimate}</span>
							<h2 id="battle-ultimate-title">{pendingUltimate.personaName}</h2>
							<p id="battle-ultimate-description">{replaceTokens(content.playtest.confirmUltimate, { name: pendingUltimate.personaName })}</p>
							<div className="battle-ultimate-actions">
								<button type="button" autoFocus onClick={() => setPendingUltimate(null)}>
									{content.playtest.cancel}
								</button>
								<button className="confirm" type="button" onClick={confirmUltimate}>
									{content.playtest.ultimate}
								</button>
							</div>
						</section>
					</div>,
					document.body,
				)}

			{selectedPersona &&
				createPortal(
					<div
						className={`persona-dialog-backdrop${personaPicker ? " is-above-picker" : ""}`}
						role="presentation"
						onMouseDown={(event) => {
							if (event.target === event.currentTarget) setSelectedPersonaId(null);
						}}
					>
						<section className="persona-dialog" role="dialog" aria-modal="true" aria-label={formatName(content.ui.personaSheetFor, selectedPersona.name)}>
							<header className="persona-dialog-toolbar">
								<span>{content.ui.personaSheet}</span>
								<div className="persona-dialog-toolbar-actions">
									<MusicToggle muted={musicMuted} onToggle={onMusicToggle} content={content} />
									<LanguageToggle language={language} onChange={onLanguageChange} ariaLabel={content.ui.languageAria} />
									<button type="button" autoFocus onClick={() => setSelectedPersonaId(null)}>
										{content.ui.close}
									</button>
								</div>
							</header>
							<div className="persona-dialog-content">
								<PersonaCardView persona={selectedPersona} content={content} language={language} />
							</div>
						</section>
					</div>,
					document.body,
				)}
		</div>
	);
}

function Credits({ onMenu, content, language, onLanguageChange, musicMuted, onMusicToggle }: { onMenu: () => void; content: GameContent; language: Language; onLanguageChange: (language: Language) => void } & MusicControlProps) {
	return (
		<div className="page-view credits-view screen-enter">
			<ScreenHeader onMenu={onMenu} content={content} language={language} onLanguageChange={onLanguageChange} musicMuted={musicMuted} onMusicToggle={onMusicToggle} />
			<main className="credits-space">
				<article className="credits-copy">
					<header>
						<span>{content.credits.eyebrow}</span>
						<h2>{content.credits.title}</h2>
					</header>
					<div className="credits-body">
						{content.credits.paragraphs.map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
					</div>
					<aside className="credits-music" aria-label={content.credits.musicCredit.label}>
						<span>{content.credits.musicCredit.label}</span>
						<p>
							<a href={content.credits.musicCredit.url} target="_blank" rel="noreferrer">
								{content.credits.musicCredit.title}
							</a>{" "}
							{content.credits.musicCredit.by} <strong>{content.credits.musicCredit.author}</strong>
							{" · "}
							<a href={content.credits.musicCredit.licenseUrl} target="_blank" rel="noreferrer">
								{content.credits.musicCredit.license}
							</a>
						</p>
					</aside>
					<footer>
						<p>{content.credits.note}</p>
						<a href="mailto:andrei.bituleanu@umontreal.ca">{content.credits.contact}</a>
					</footer>
				</article>
			</main>
		</div>
	);
}

function RuleCardView({ card }: { card: RuleCard }) {
	return (
		<article className="rule-card">
			<h4>{card.title}</h4>
			{card.paragraphs.map((paragraph) => (
				<p key={paragraph}>{paragraph}</p>
			))}
			{card.points && (
				<ul>
					{card.points.map((point) => (
						<li key={point.term}>
							<strong>{point.term}</strong> {point.text}
						</li>
					))}
				</ul>
			)}
			{card.callout && (
				<div className="rule-callout">
					<strong>{card.callout.title}</strong>
					<p>{card.callout.text}</p>
				</div>
			)}
			{card.note && <div className="rule-note">{card.note}</div>}
		</article>
	);
}

function Rules({ onMenu, content, language, onLanguageChange, musicMuted, onMusicToggle }: { onMenu: () => void; content: GameContent; language: Language; onLanguageChange: (language: Language) => void } & MusicControlProps) {
	const { cardTypes, duoBuilding, turn, reactions, lexicon } = content.rules.sections;
	const ruleIndex = [cardTypes, duoBuilding, turn, reactions, lexicon];

	return (
		<div className="page-view screen-enter">
			<ScreenHeader onMenu={onMenu} content={content} language={language} onLanguageChange={onLanguageChange} musicMuted={musicMuted} onMusicToggle={onMusicToggle} />

			<main className="content-shell rules-layout">
				<aside className="rules-index" aria-label={content.ui.ruleSectionsAria}>
					<p className="index-title">{content.rules.title}</p>
					{ruleIndex.map((section) => (
						<a href={`#${section.id}`} key={section.id}>
							{section.title}
						</a>
					))}
				</aside>

				<div className="rulebook">
					<header className="page-title">
						<p>{content.rules.eyebrow}</p>
						<h2>{content.rules.title}</h2>
					</header>

					<section className="rule-section" id={cardTypes.id}>
						<div className="section-number">{cardTypes.number}</div>
						<div className="section-copy">
							<h3>{cardTypes.title}</h3>
							{cardTypes.cards.map((card) => (
								<RuleCardView card={card} key={card.title} />
							))}
						</div>
					</section>

					<section className="rule-section" id={duoBuilding.id}>
						<div className="section-number">{duoBuilding.number}</div>
						<div className="section-copy">
							<h3>{duoBuilding.title}</h3>
							<p className="section-intro">{duoBuilding.intro}</p>
							<div className="strategy-grid">
								{duoBuilding.strategies.map((strategy) => (
									<article className="strategy-card" key={strategy.label}>
										<span>{strategy.label}</span>
										<h4>{strategy.title}</h4>
										<p>{strategy.text}</p>
									</article>
								))}
							</div>
						</div>
					</section>

					<section className="rule-section" id={turn.id}>
						<div className="section-number">{turn.number}</div>
						<div className="section-copy">
							<h3>{turn.title}</h3>
							<p className="section-intro">{turn.intro}</p>
							<ol className="phase-list">
								{turn.phases.map((phase) => (
									<li key={phase.number}>
										<div className="phase-marker">{phase.number}</div>
										<div>
											<h4>{phase.title}</h4>
											<p>{phase.text}</p>
											{phase.items && (
												<ul>
													{phase.items.map((item) => (
														<li key={item}>{item}</li>
													))}
												</ul>
											)}
											{phase.note && <div className="rule-note">{phase.note}</div>}
										</div>
									</li>
								))}
							</ol>
						</div>
					</section>

					<section className="rule-section" id={reactions.id}>
						<div className="section-number">{reactions.number}</div>
						<div className="section-copy">
							<h3>{reactions.title}</h3>
							<div className="reaction-uses">
								{reactions.uses.map((use) => (
									<article key={use.label}>
										<span>{use.label}</span>
										<p>{use.text}</p>
									</article>
								))}
							</div>
						</div>
					</section>

					<section className="rule-section" id={lexicon.id}>
						<div className="section-number">{lexicon.number}</div>
						<div className="section-copy">
							<h3>{lexicon.title}</h3>
							<dl className="lexicon-list">
								{lexicon.entries.map((entry) => (
									<div key={entry.term}>
										<dt>{entry.term}</dt>
										<dd>{entry.definition}</dd>
									</div>
								))}
							</dl>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}

function PersonaArtwork({ name, className, eager = false, onAvailabilityChange }: { name: string; className: string; eager?: boolean; onAvailabilityChange?: (isAvailable: boolean) => void }) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [hasFailed, setHasFailed] = useState(false);

	useEffect(() => {
		setIsLoaded(false);
		setHasFailed(false);
	}, [name]);

	if (hasFailed) return null;

	return (
		<img
			className={`${className}${isLoaded ? " is-loaded" : ""}`}
			src={`/${encodeURIComponent(name)}.png`}
			alt=""
			draggable={false}
			loading={eager ? "eager" : "lazy"}
			decoding="async"
			onLoad={() => {
				setIsLoaded(true);
				onAvailabilityChange?.(true);
			}}
			onError={() => {
				setHasFailed(true);
				onAvailabilityChange?.(false);
			}}
		/>
	);
}

function PersonaCardView({ persona, content, language }: { persona: Persona; content: GameContent; language: Language }) {
	const [hasArtwork, setHasArtwork] = useState(false);
	const [hasFullArt, setHasFullArt] = useState(false);
	const [artView, setArtView] = useState<"portrait" | "fullArt">("portrait");
	const swipeStartX = useRef<number | null>(null);
	const isFullArtVisible = hasFullArt && artView === "fullArt";

	return (
		<article className={`persona-card${hasArtwork ? " has-artwork" : ""}${hasFullArt ? " has-full-art" : ""}${isFullArtVisible ? " is-full-art" : ""}`} data-persona={persona.id} lang={language}>
			<header className="persona-card-header">
				<div
					className="persona-card-artwork"
					onPointerDown={(event) => {
						if (!hasFullArt || (event.pointerType === "mouse" && event.button !== 0)) return;
						swipeStartX.current = event.clientX;
						event.currentTarget.setPointerCapture(event.pointerId);
					}}
					onPointerUp={(event) => {
						if (swipeStartX.current === null) return;
						const swipeDistance = event.clientX - swipeStartX.current;
						swipeStartX.current = null;

						if (Math.abs(swipeDistance) >= 40) setArtView(swipeDistance < 0 ? "fullArt" : "portrait");
						if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
					}}
					onPointerCancel={() => {
						swipeStartX.current = null;
					}}
				>
					<PersonaArtwork name={persona.asset} className="persona-detail-image" eager onAvailabilityChange={setHasArtwork} />
					<PersonaArtwork name={`${persona.asset}FullArt`} className="persona-full-art-image" eager onAvailabilityChange={setHasFullArt} />

					<div className="persona-art-switch" role="group" aria-label={formatName(content.ui.artworksFor, persona.name)} onPointerDown={(event) => event.stopPropagation()}>
						<button type="button" aria-pressed={!isFullArtVisible} className={!isFullArtVisible ? "active" : ""} onClick={() => setArtView("portrait")}>
							{content.ui.portrait}
						</button>
						<button type="button" disabled={!hasFullArt} aria-pressed={isFullArtVisible} className={isFullArtVisible ? "active" : ""} onClick={() => setArtView("fullArt")}>
							{content.ui.fullArt}
						</button>
					</div>
				</div>

				<div className="persona-card-profile">
					<span className="persona-card-kicker">{content.ui.persona}</span>
					<h3>{persona.name}</h3>
					<div className="persona-stats">
						<div>
							<span>{content.ui.healthPoints}</span>
							<strong>{persona.health}</strong>
						</div>
						<div>
							<span>{content.ui.tweak}</span>
							<strong>{persona.tweak}</strong>
						</div>
					</div>
				</div>
			</header>

			<div className="persona-card-details">
				<div className="persona-abilities">
					{persona.abilities.map((ability) => (
						<section className={`persona-ability${ability.kind === "ultimate" ? " is-ultimate" : ability.kind === "passive" ? " is-passive" : ""}`} key={`${persona.id}-${ability.kind}`}>
							<header className="persona-ability-heading">
								<span>{ability.label}</span>
								<h4>{ability.name}</h4>
								{ability.cost && <b>{ability.cost}</b>}
							</header>

							<div className="persona-ability-copy">
								{ability.blocks.map((block, index) => (
									<div className={`persona-ability-block${block.italic ? " is-italic" : ""}`} key={`${ability.kind}-${index}`}>
										{block.label && (
											<strong>
												<DiceText text={block.label} content={content} />
											</strong>
										)}
										{block.text && (
											<p>
												<DiceText text={block.text} content={content} />
											</p>
										)}
										{block.items && (
											<ul>
												{block.items.map((item) => (
													<li key={item}>
														<DiceText text={item} content={content} />
													</li>
												))}
											</ul>
										)}
									</div>
								))}
							</div>
						</section>
					))}
				</div>

				<footer className={`persona-inert${persona.becomesInert === false ? " stays-active" : ""}`}>
					<span>{content.ui.afterUltimate}</span>
					<strong>{persona.ultimateAftermath ?? formatName(persona.becomesInert === false ? content.ui.staysActive : content.ui.becomesInert, persona.name.toLocaleUpperCase(language === "fr" ? "fr-FR" : "en-US"))}</strong>
				</footer>
			</div>
		</article>
	);
}

function PersonaTile({ persona, onSelect, content }: { persona: Persona; onSelect: (personaId: string) => void; content: GameContent }) {
	const [hasArtwork, setHasArtwork] = useState(false);

	return (
		<button
			className={`persona-tile${hasArtwork ? " has-artwork" : ""}${persona.placeholder ? " is-placeholder" : ""}`}
			data-persona={persona.id}
			type="button"
			aria-label={persona.placeholder ? `${persona.name}, ${content.ui.personaComingSoon}` : formatName(content.ui.viewPersonaSheet, persona.name)}
			disabled={persona.placeholder}
			onClick={() => onSelect(persona.id)}
		>
			<div className="persona-tile-visual" aria-hidden="true">
				<PersonaArtwork name={persona.asset} className="persona-tile-image" onAvailabilityChange={setHasArtwork} />
				<span className="persona-name-fallback">{persona.name}</span>
				{persona.placeholder ? (
					<div className="persona-tile-placeholder">{content.ui.personaComingSoon}</div>
				) : (
					<div className="persona-tile-stats">
						<span>
							<b>{persona.health}</b> {content.ui.hpShort}
						</span>
						<span>
							<b>{persona.tweak}</b> {content.ui.tweak}
						</span>
					</div>
				)}
			</div>
			<div className="persona-tile-copy">
				<strong>{persona.name}</strong>
				<span>{persona.placeholder ? content.ui.comingSoon : content.ui.viewSheet}</span>
			</div>
		</button>
	);
}

function Bestiary({ onMenu, content, language, onLanguageChange, musicMuted, onMusicToggle }: { onMenu: () => void; content: GameContent; language: Language; onLanguageChange: (language: Language) => void } & MusicControlProps) {
	const [section, setSection] = useState<BestiarySection>("personas");
	const [personaView, setPersonaView] = useState<"grouped" | "all">("grouped");
	const [synergyToneFilter, setSynergyToneFilter] = useState<SynergyTone | "all">("all");
	const [synergyPersonaFilter, setSynergyPersonaFilter] = useState("all");
	const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
	const selectedPersona = selectedPersonaId ? (content.personas.find((persona) => persona.id === selectedPersonaId) ?? null) : null;
	const synergyPersonaNames = Array.from(new Set(content.bestiary.synergies.flatMap((category) => category.synergies.flatMap((synergy) => synergy.personas.map((persona) => persona.name))))).sort((firstName, secondName) =>
		firstName.localeCompare(secondName, language),
	);
	const visibleSynergyCategories = content.bestiary.synergies
		.filter((category) => synergyToneFilter === "all" || category.tone === synergyToneFilter)
		.map((category) => ({
			...category,
			synergies: category.synergies.filter((synergy) => synergyPersonaFilter === "all" || synergy.personas.some((persona) => persona.name === synergyPersonaFilter)),
		}))
		.filter((category) => category.synergies.length > 0);

	useEffect(() => {
		if (!selectedPersonaId) return;

		const previousOverflow = document.body.style.overflow;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSelectedPersonaId(null);
		};

		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", closeOnEscape);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [selectedPersonaId]);

	const selectSection = (nextSection: BestiarySection) => {
		setSelectedPersonaId(null);
		setSection(nextSection);
	};

	return (
		<div className="page-view screen-enter">
			<ScreenHeader onMenu={onMenu} content={content} language={language} onLanguageChange={onLanguageChange} musicMuted={musicMuted} onMusicToggle={onMusicToggle} />

			<main className="content-shell bestiary-shell">
				<header className="page-title bestiary-title">
					<p>{content.bestiary.eyebrow}</p>
					<h2>{content.bestiary.title}</h2>
				</header>

				<div className="bestiary-tabs" role="tablist" aria-label={content.ui.bestiarySectionsAria}>
					{content.bestiary.tabs.map((item) => (
						<button key={item.id} type="button" role="tab" aria-selected={section === item.id} className={section === item.id ? "active" : ""} onClick={() => selectSection(item.id)}>
							{item.label}
						</button>
					))}
				</div>

				<section className="bestiary-content" role="tabpanel" key={section}>
					{section === "personas" && (
						<div className="persona-browser">
							<div className="persona-view-switch" role="group" aria-label={content.bestiary.personaView.ariaLabel}>
								<button type="button" className={personaView === "grouped" ? "active" : ""} aria-pressed={personaView === "grouped"} onClick={() => setPersonaView("grouped")}>
									{content.bestiary.personaView.grouped}
								</button>
								<button type="button" className={personaView === "all" ? "active" : ""} aria-pressed={personaView === "all"} onClick={() => setPersonaView("all")}>
									{content.bestiary.personaView.all}
								</button>
							</div>

							{personaView === "grouped" ? (
								<div className="persona-subclasses">
									{content.bestiary.personaGroups.map((group) => (
										<section className={`persona-subclass is-${group.id}`} key={group.id}>
											<header className="persona-subclass-heading">
												<h3>{group.label}</h3>
												<span aria-hidden="true" />
											</header>
											<div className="persona-grid">
												{content.personas
													.filter((persona) => persona.subclass === group.id)
													.sort((firstPersona, secondPersona) => group.personaIds.indexOf(firstPersona.id) - group.personaIds.indexOf(secondPersona.id))
													.map((persona) => (
														<PersonaTile persona={persona} onSelect={setSelectedPersonaId} content={content} key={persona.id} />
													))}
											</div>
										</section>
									))}
								</div>
							) : (
								<div className="persona-grid persona-grid-all">
									{content.personas.map((persona) => (
										<PersonaTile persona={persona} onSelect={setSelectedPersonaId} content={content} key={persona.id} />
									))}
								</div>
							)}
						</div>
					)}

					{section === "objects" && (
						<div className="catalog-grid single-entry">
							<article className="catalog-card object-card">
								<div className="catalog-card-topline">
									<span>{content.bestiary.object.type}</span>
									<b>{content.bestiary.object.badge}</b>
								</div>
								<div className="catalog-card-art catalog-icon-art" aria-hidden="true">
									<svg className="catalog-svg shield-svg" viewBox="0 0 120 140" focusable="false">
										<path d="M60 8 106 26v38c0 32-18 56-46 70C32 120 14 96 14 64V26L60 8Z" />
										<path d="M60 26 88 37v27c0 21-10 37-28 48-18-11-28-27-28-48V37L60 26Z" />
									</svg>
								</div>
								<div className="catalog-card-copy">
									<h3>{content.bestiary.object.name}</h3>
									<p>{content.bestiary.object.description}</p>
								</div>
							</article>
						</div>
					)}

					{section === "reactions" && (
						<div className="catalog-grid single-entry">
							<article className="catalog-card reaction-card">
								<div className="catalog-card-topline">
									<span>{content.bestiary.reaction.type}</span>
									<b>{content.bestiary.reaction.badge}</b>
								</div>
								<div className="catalog-card-art catalog-icon-art" aria-hidden="true">
									<svg className="catalog-svg cigarette-svg" viewBox="0 0 180 110" focusable="false">
										<g transform="rotate(-10 90 58)">
											<rect className="cigarette-paper" x="24" y="50" width="116" height="20" rx="2" />
											<rect className="cigarette-filter" x="102" y="50" width="38" height="20" rx="2" />
											<path className="cigarette-filter-lines" d="M110 53v14m8-14v14m8-14v14" />
											<path className="cigarette-ember" d="M24 50v20" />
										</g>
										<path className="cigarette-smoke" d="M28 47c-12-8 8-15-2-25M43 42c-9-7 7-12 0-21" />
									</svg>
								</div>
								<div className="catalog-card-copy">
									<h3>{content.bestiary.reaction.name}</h3>
									<p>{content.bestiary.reaction.description}</p>
								</div>
							</article>
						</div>
					)}

					{section === "synergies" && (
						<div className="synergy-browser">
							<div className="synergy-controls">
								<div className="synergy-tone-filter" role="group" aria-label={content.bestiary.synergyFilters.ariaLabel}>
									{(
										[
											{ value: "all", label: content.bestiary.synergyFilters.allTypes },
											{ value: "synergistic", label: content.bestiary.synergyFilters.synergistic },
											{ value: "antagonistic", label: content.bestiary.synergyFilters.antagonistic },
										] as const
									).map((filter) => (
										<button key={filter.value} type="button" data-tone={filter.value} className={synergyToneFilter === filter.value ? "active" : ""} aria-pressed={synergyToneFilter === filter.value} onClick={() => setSynergyToneFilter(filter.value)}>
											{filter.label}
										</button>
									))}
								</div>

								<label className="synergy-persona-filter">
									<span>{content.bestiary.synergyFilters.personaLabel}</span>
									<span className="synergy-select-wrap">
										<select value={synergyPersonaFilter} onChange={(event) => setSynergyPersonaFilter(event.target.value)}>
											<option value="all">{content.bestiary.synergyFilters.allPersonas}</option>
											{synergyPersonaNames.map((personaName) => (
												<option value={personaName} key={personaName}>
													{personaName}
												</option>
											))}
										</select>
									</span>
								</label>
							</div>

							{visibleSynergyCategories.length > 0 ? (
								<div className="synergy-board">
									{visibleSynergyCategories.map((category) => (
										<section className={`synergy-category is-${category.tone}`} key={category.tone}>
											<header className="synergy-category-heading">
												<div>
													<span>{category.label}</span>
													<h3>{category.title}</h3>
												</div>
												<p>{category.description}</p>
											</header>

											<div className="synergy-grid">
												{category.synergies.map((synergy) => (
													<article className="synergy-card" key={synergy.personas.map((persona) => persona.name).join("-")} tabIndex={0}>
														<div className="synergy-pair">
															{synergy.personas.map((persona, index) => {
																const personaRecord = content.personas.find((candidate) => (persona.id ? candidate.id === persona.id : candidate.name === persona.name));

																return (
																	<div className="synergy-persona" data-persona={personaRecord?.id} key={persona.name}>
																		<PersonaArtwork name={personaRecord?.asset ?? persona.name} className="synergy-persona-image" />
																		<i className="synergy-persona-fallback" aria-hidden="true"></i>
																		<div className="synergy-persona-copy">
																			<span>{persona.role}</span>
																			<strong>{persona.name}</strong>
																		</div>
																		{index === 0 && <b aria-hidden="true">&amp;</b>}
																	</div>
																);
															})}
														</div>

														<div className="synergy-panel">
															<div className="synergy-result">
																<span>{category.tone === "synergistic" ? content.ui.fusion : content.ui.carryBuff}</span>
																<p>{synergy.result}</p>
															</div>

															{category.tone === "antagonistic" && (
																<div className="synergy-nerf">
																	<span>{content.ui.supportNerf}</span>
																	<p>{synergy.interaction}</p>
																</div>
															)}
														</div>
													</article>
												))}
											</div>
										</section>
									))}
								</div>
							) : (
								<p className="synergy-empty-state" role="status">
									{content.bestiary.synergyFilters.noResults}
								</p>
							)}
						</div>
					)}
				</section>
			</main>

			{selectedPersona &&
				createPortal(
					<div
						className="persona-dialog-backdrop"
						role="presentation"
						onMouseDown={(event) => {
							if (event.target === event.currentTarget) setSelectedPersonaId(null);
						}}
					>
						<section className="persona-dialog" role="dialog" aria-modal="true" aria-label={formatName(content.ui.personaSheetFor, selectedPersona.name)}>
							<header className="persona-dialog-toolbar">
								<span>{content.ui.personaSheet}</span>
								<div className="persona-dialog-toolbar-actions">
									<MusicToggle muted={musicMuted} onToggle={onMusicToggle} content={content} />
									<LanguageToggle language={language} onChange={onLanguageChange} ariaLabel={content.ui.languageAria} />
									<button type="button" autoFocus onClick={() => setSelectedPersonaId(null)}>
										{content.ui.close}
									</button>
								</div>
							</header>
							<div className="persona-dialog-content">
								<PersonaCardView persona={selectedPersona} content={content} language={language} />
							</div>
						</section>
					</div>,
					document.body,
				)}
		</div>
	);
}

function App() {
	const [view, setView] = useState<View>("menu");
	const audioRef = useRef<HTMLAudioElement>(null);
	const [musicMuted, setMusicMuted] = useState(() => window.localStorage.getItem("duality-music-muted") === "true");
	const [language, setLanguage] = useState<Language>(() => {
		const storedLanguage = window.localStorage.getItem("tweaka-language");
		if (storedLanguage === "en" || storedLanguage === "fr") return storedLanguage;
		return window.navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
	});
	const content = contentByLanguage[language];

	useEffect(() => {
		document.documentElement.lang = language;
		window.localStorage.setItem("tweaka-language", language);
	}, [language]);

	useEffect(() => {
		const scrollLockClass = "is-main-menu-open";
		const isMenuOpen = view === "menu";
		const root = document.documentElement;
		const viewport = window.visualViewport;
		const syncMenuViewport = () => {
			const viewportHeight = viewport?.height ?? window.innerHeight;
			root.style.setProperty("--menu-viewport-height", `${Math.round(viewportHeight)}px`);
		};
		const preventMenuOverscroll = (event: TouchEvent) => {
			if (event.touches.length === 1) event.preventDefault();
		};

		root.classList.toggle(scrollLockClass, isMenuOpen);
		document.body.classList.toggle(scrollLockClass, isMenuOpen);

		if (isMenuOpen) {
			syncMenuViewport();
			window.scrollTo(0, 0);
			window.addEventListener("resize", syncMenuViewport);
			viewport?.addEventListener("resize", syncMenuViewport);
			viewport?.addEventListener("scroll", syncMenuViewport);
			document.addEventListener("touchmove", preventMenuOverscroll, { passive: false });
		}

		return () => {
			root.classList.remove(scrollLockClass);
			document.body.classList.remove(scrollLockClass);
			window.removeEventListener("resize", syncMenuViewport);
			viewport?.removeEventListener("resize", syncMenuViewport);
			viewport?.removeEventListener("scroll", syncMenuViewport);
			document.removeEventListener("touchmove", preventMenuOverscroll);
		};
	}, [view]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		audio.volume = 0.28;
		audio.muted = false;
		window.localStorage.setItem("duality-music-muted", String(musicMuted));
		if (musicMuted) audio.pause();
		else safelyPlay(audio);
	}, [musicMuted]);

	useEffect(() => {
		const unlockAudio = () => {
			const audio = audioRef.current;
			if (audio && !musicMuted) safelyPlay(audio);
			window.removeEventListener("pointerdown", unlockAudio);
			window.removeEventListener("keydown", unlockAudio);
		};

		window.addEventListener("pointerdown", unlockAudio, { once: true });
		window.addEventListener("keydown", unlockAudio, { once: true });

		return () => {
			window.removeEventListener("pointerdown", unlockAudio);
			window.removeEventListener("keydown", unlockAudio);
		};
	}, [musicMuted]);

	const toggleMusic = () => {
		const nextMuted = !musicMuted;
		const audio = audioRef.current;

		if (audio) {
			if (nextMuted) audio.pause();
			else safelyPlay(audio);
		}

		setMusicMuted(nextMuted);
	};

	return (
		<div className="game-shell">
			<audio ref={audioRef} src={backgroundMusic} loop preload="auto" aria-hidden="true" />
			<div className="background-glow background-glow-left" aria-hidden="true" />
			<div className="background-glow background-glow-right" aria-hidden="true" />
			<div className="grain" aria-hidden="true" />

			{view === "menu" && <MainMenu onSelect={setView} content={content} language={language} onLanguageChange={setLanguage} musicMuted={musicMuted} onMusicToggle={toggleMusic} />}
			{view === "play" && <Play onMenu={() => setView("menu")} content={content} language={language} onLanguageChange={setLanguage} musicMuted={musicMuted} onMusicToggle={toggleMusic} />}
			{view === "rules" && <Rules onMenu={() => setView("menu")} content={content} language={language} onLanguageChange={setLanguage} musicMuted={musicMuted} onMusicToggle={toggleMusic} />}
			{view === "bestiary" && <Bestiary onMenu={() => setView("menu")} content={content} language={language} onLanguageChange={setLanguage} musicMuted={musicMuted} onMusicToggle={toggleMusic} />}
			{view === "credits" && <Credits onMenu={() => setView("menu")} content={content} language={language} onLanguageChange={setLanguage} musicMuted={musicMuted} onMusicToggle={toggleMusic} />}
		</div>
	);
}

export default App;
