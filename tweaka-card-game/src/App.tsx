import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { contentByLanguage, type BestiarySection, type GameContent, type Language, type Persona, type RuleCard, type SynergyTone, type View } from "./data/content";
import backgroundMusic from "./music/veritas.mp3";

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
					<span
						id={tooltipId}
						className={`dice-tooltip is-${position.placement}`}
						style={{ top: position.top, left: position.left, maxWidth: position.maxWidth }}
						role="tooltip"
					>
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
					<path className="music-state" d="m17 9 4 4m0-4-4 4" />
				) : (
					<>
						<path className="music-state" d="M16 9.2c1.4 1.5 1.4 4.1 0 5.6" />
						<path className="music-state music-wave-outer" d="M19 6.7c2.9 2.9 2.9 7.7 0 10.6" />
					</>
				)}
			</svg>
		</button>
	);
}

function ScreenHeader({ onMenu, content, language, onLanguageChange, musicMuted, onMusicToggle }: { onMenu: () => void; content: GameContent; language: Language; onLanguageChange: (language: Language) => void } & MusicControlProps) {
	return (
		<header className="screen-header">
			<button className="header-wordmark" type="button" onClick={onMenu}>
				Duality
			</button>
			<div className="screen-header-actions">
				<MusicToggle muted={musicMuted} onToggle={onMusicToggle} content={content} />
				<LanguageToggle language={language} onChange={onLanguageChange} ariaLabel={content.ui.languageAria} />
				<button className="menu-return" type="button" onClick={onMenu}>
					{content.ui.return}
				</button>
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

function Play({ onMenu, content, language, onLanguageChange, musicMuted, onMusicToggle }: { onMenu: () => void; content: GameContent; language: Language; onLanguageChange: (language: Language) => void } & MusicControlProps) {
	return (
		<div className="page-view play-view screen-enter">
			<ScreenHeader onMenu={onMenu} content={content} language={language} onLanguageChange={onLanguageChange} musicMuted={musicMuted} onMusicToggle={onMusicToggle} />
			<main className="play-space" aria-label={content.ui.playAria}>
				<p>{content.ui.playMessage}</p>
			</main>
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
		const audio = audioRef.current;
		if (!audio) return;

		audio.volume = 0.28;
		audio.muted = musicMuted;
		window.localStorage.setItem("duality-music-muted", String(musicMuted));
		if (!musicMuted) safelyPlay(audio);
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
			audio.muted = nextMuted;
			if (!nextMuted) safelyPlay(audio);
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
