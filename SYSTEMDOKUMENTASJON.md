# Systemdokumentasjon: Pasinfo Vaksine V2

## Innholdsfortegnelse
1. [Systemoversikt](#systemoversikt)
2. [Arkitektur](#arkitektur)
3. [API-integrasjoner](#api-integrasjoner)
4. [Dataverse-entiteter](#dataverse-entiteter)
5. [Applikasjonsfunksjonalitet](#applikasjonsfunksjonalitet)
6. [Sikkerhet og tilgangskontroll](#sikkerhet-og-tilgangskontroll)
7. [Dataflyt](#dataflyt)
8. [Teknisk konfigurasjon](#teknisk-konfigurasjon)

---

## Systemoversikt

**Applikasjonsnavn:** Pasinfo Vaksine V2
**Versjon:** 2.06
**Plattform:** Microsoft Power Apps (Canvas App)
**Type:** Desktop/Tablet-applikasjon
**Organisasjon:** Oslo Kommune

### Formål
Pasinfo Vaksine V2 er et omfattende vaksinasjonshåndteringssystem designet for å strømlinjeforme vaksineringsprosesser. Systemet støtter:
- Søk etter enkeltpersoner via fødselsnummer eller navn
- Håndtering av timeavtaler for vaksinering
- Registrering av vaksinasjoner
- Dokumentasjon av notater og erklæringer
- Støtte for både ansatt- og innbyggervaksinering
- Utsending av SMS-varsler
- Overvåking av vaksinasjonsstatus
- Integrasjon med nasjonale systemer (SYSVAK)

### Hovedfunksjoner
1. **Timebooking og vaksinering** - Primærfunksjon for registrering av nye vaksineringer
2. **Etterregistering** - Registrering av vaksiner satt andre steder (foreløpig deaktivert)
3. **Personsøk** - Søk via Folkeregisteret (FIKS)
4. **Innbyggerbooking** - Selvbetjent booking for innbyggere
5. **SMS-varsling** - Automatisk utsending av påminnelser og bekreftelser
6. **SYSVAK-integrasjon** - Rapportering til nasjonalt vaksinasjonsregister

---

## Arkitektur

### Teknisk arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│              Power Apps Canvas Application                   │
│                   (Pasinfo Vaksine V2)                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Custom APIs │   │   Dataverse  │   │ Graph API    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ FIKS         │   │ Entiteter    │   │ Azure AD     │
│ KRR          │   │ (18 tabeller)│   │ Grupper      │
│ Vaksinering  │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │
        ▼
┌──────────────┐
│   SYSVAK     │
│ (NHN/FHI)    │
└──────────────┘
```

### Applikasjonsstruktur

**Skjermer:**
1. `Hovedmeny` - Startside med valg av organisasjon og funksjon
2. `Screen_Hoved` - Hovedarbeidsflate for vaksinering og timebooking

**Komponenter:**
1. `Header_3` - Egendefinert header-komponent
2. Fluent UI-komponenter:
   - FluentDetailsList (flere instanser for tabellvisninger)
   - SearchBox (søkefunksjonalitet)
   - Icon (ikoner)
   - ResponsiveIframe (for embedded innhold)

**Layout:**
- Bredde: 1366px
- Høyde: 768px
- Orientering: Landscape (liggående)
- Enhet: Desktop/Tablet

---

## API-integrasjoner

### 1. FiksFolkeregisteretv2 (FIKS)

**Tilkobling ID:** `bcc967f5-32e3-40e4-aea1-48ea34b44038`
**Formål:** Søk og henting av persondata fra Folkeregisteret

#### Operasjoner:
- **Personsoek** - Søk etter personer basert på navn og/eller fødselsdato
  - Input: `navn` (string), `foedselsdato` (string format: YYYYMMDD)
  - Output: Liste over personer med fødselsnummer

- **HentSisteVersjonAvPerson** - Hent fullstendig personinformasjon
  - Input: Fødselsnummer (11 siffer)
  - Output: Persondetaljer inkludert navn, adresse, fødselsdato

**API Tier:** Standard
**Type:** Custom API
**Logical Name:** `pasinfo_fiksfolkeregisteretv2`

#### Brukseksempel i koden:
```javascript
FiksFolkeregisteret.Personsoek({
    navn: NavnFnrInput.Text,
    foedselsdato: "20001231"  // YYYYMMDD format
}).foedselsEllerDNummer
```

---

### 2. KontaktReservasjonv2 (KRR)

**Tilkobling ID:** `e070225c-7a21-443f-9772-32ff156c8ca7`
**Formål:** Henting av kontaktinformasjon fra Kontakt- og reservasjonsregisteret

#### Operasjoner:
- **Person** - Hent kontaktinformasjon for en person
  - Input: Fødselsnummer
  - Output: E-post, mobilnummer, reservasjonsstatus

**API Tier:** Standard
**Type:** Custom API
**Logical Name:** `pasinfo_kontaktreservasjonv2`

#### Data som hentes:
- E-postadresse
- Mobilnummer
- Reservasjonsstatus mot digital kommunikasjon

---

### 3. Vaksinering API

**Tilkobling ID:** `13fac446-7a5b-499c-94ca-db3381b40471`
**Formål:** Henting av vaksinasjonshistorikk fra eksterne systemer

#### Operasjoner:
- **hent-covid-vaksineringer** - Hent COVID-19 vaksinasjonshistorikk
  - Input: Fødselsnummer
  - Output: Liste over tidligere COVID-vaksiner

**API Tier:** Standard
**Type:** Custom API
**Logical Name:** `new_5Fvaksinering-20`

**Merknad:** Denne APIen brukes spesifikt for COVID-19 vaksiner og kan utvides for andre vaksinetyper.

---

### 4. GraphAPI_Brukeradmin

**Tilkobling ID:** `4bf2b85f-0bd6-4419-ab1a-27cc48d0aa48`
**Formål:** Tilgangskontroll via Microsoft Graph API

#### Operasjoner:
- **checkMemberGroups** - Sjekk om bruker er medlem av spesifikke Azure AD-grupper
  - Input: `EntraObjectId` (brukerens Azure AD objekt-ID), gruppefilter
  - Output: Liste over grupper brukeren tilhører

**API Tier:** Standard
**Type:** Custom API
**Logical Name:** `pasinfo_5Fgraphapi-5Fbrukeradmin`

#### Brukseksempel:
```javascript
Graph.checkMemberGroups(
    User().EntraObjectId,
    {
        '$filter': "id eq '" & InnbyggerVaksineAdGruppe & "'",
        '$select': "displayName"
    }
).value
```

#### Sikkerhetskontekst:
Systemet sjekker medlemskap i tre AD-grupper ved oppstart:
1. **AdminAdGruppe** - Full administratortilgang
2. **AnsattVaksineAdGruppe** - Tilgang til ansattvaksinering
3. **InnbyggerVaksineAdGruppe** - Tilgang til innbyggervaksinering

---

## Dataverse-entiteter

Applikasjonen benytter følgende Dataverse-entiteter (tabeller):

### Hovedentiteter

#### 1. Vaksinerings (sogv_vaksinering)
**Formål:** Hovedtabell for vaksineregistreringer og timeavtaler

**Nøkkelfelt:**
- `sogv_vaksineringid` (GUID) - Primærnøkkel
- `sogv_fnr` (String) - Fødselsnummer (11 siffer)
- `sogv_name` (String) - Navn på person
- `sogv_timeavtale` (DateTime) - Tidspunkt for timeavtale
- `sogv_konsultasjonsdato` (DateTime) - Konsultasjonsdato
- `sogv_vaksineringstatus` (Choice) - Status for timeavtalen
- `sogv_Vaksinetype` (Lookup) - Referanse til vaksinetypen
- `sogv_hovedtypevaksine` (Choice) - Hovedkategori (Influensa, COVID, Mpox, etc.)
- `sogv_Account` (Lookup) - Hvilken helseenhet som utfører vaksineringen
- `sogv_Contact` (Lookup) - Kobling til kontaktperson
- `sogv_VaksineInnbygger` (Lookup) - Kobling til innbyggerprofil
- `sogv_pasinfo_Ansatt` (Lookup) - Ansatt som utførte vaksineringen

**Vaksinerelaterte felt:**
- `sogv_vaksineersatt` (Boolean) - Om vaksinen er satt
- `sogv_batchnummer` (String) - Batchnummer på vaksine
- `sogv_vaksinesattav` (String) - Hvem som satte vaksinen
- `sogv_ansvarliglege` (String) - Ansvarlig lege

**SYSVAK-integrasjon:**
- `sogv_sendttilsysvak` (DateTime) - Tidspunkt sendt til SYSVAK
- `sogv_bekreftetmottattavsysvak` (DateTime) - Bekreftet mottatt
- `sogv_nhnmeldingsstatus` (Choice) - Status (Venter/OK/Avvist)
- `sogv_feilmeldingfrasysvak` (String) - Feilmelding
- `sogv_sperretforoverfringtilsysvak` (Boolean) - Manuell sperre
- `sogv_slettesisysvak` (Boolean) - Markert for sletting
- `sogv_resendingavmeldingtilsysvak` (Boolean) - Flagg for resending

**Booking-relaterte felt:**
- `sogv_timeboktype` (Choice) - Type booking (Barn/DropIn/Timeavtale/Feltvaksinering)
- `sogv_innbyggerbooking` (Boolean) - Om innbygger kan booke denne timen
- `sogv_booketavinnbygger` (Boolean) - Om booket av innbygger
- `sogv_booketavansatt` (Boolean) - Om booket av ansatt
- `sogv_innbyggerrelatert` (Boolean) - Om relatert til innbygger
- `sogv_timebanktime` (Boolean) - Om dette er en timebanktime
- `sogv_reserverttid` (DateTime) - Reservert til tidspunkt
- `sogv_reservertsession` (String) - Reservert session ID

**SMS-relaterte felt:**
- `sogv_smsbekreftelsesendt` (Boolean) - Bekreftelse sendt
- `sogv_smsbekreftelsesendttil` (String) - Sendt til nummer
- `sogv_smspamindelsesendt` (Boolean) - Påminnelse sendt
- `sogv_smspamindelsesendttil` (String) - Sendt til nummer
- `sogv_smsavlystsendt` (Boolean) - Avlysning sendt
- `sogv_smsavlystsendttil` (String) - Sendt til nummer
- `sogv_smsotpsendt` (Boolean) - OTP sendt
- `sogv_smsotpsendttil` (String) - Sendt til nummer

**Egenerklæringer og verifisering:**
- `sogv_verifikasjonavfeilfnr` (Boolean) - Verifisert fødselsnummer
- `sogv_arsaktilvaksinering` (Choice) - Årsak (Helsepersonell/Risikogruppe/Annet/Ukjent)
- `sogv_ervaksinasjonsattpastedet` (Boolean) - Vaksinert på stedet
- `sogv_Registreringsgrunnlag` (Lookup) - Registreringsgrunnlag

**Notater og dokumentasjon:**
- `sogv_harnotat` (Boolean) - Om det finnes notater
- `sogv_antallnotater` (Rollup) - Antall notater (beregnet felt)
- `sogv_merknad` (String) - Merknadsfelt

**Hierarki:**
- `sogv_VaksineringParent` (Lookup) - Referanse til overordnet vaksineregistrering (for kombinasjonsvaksiner)

**Betalingsrelatert:**
- `sogv_betalingmottatt` (Boolean) - Om betaling er mottatt
- `sogv_egenandelbetalt` (Boolean) - Om egenandel er betalt

**Customer Voice (tilfredshet):**
- `sogv_surveyinvitationurl` (String) - URL til tilfredsundersøkelse

**Statuser:**
```
sogv_vaksineringstatus (Statusfortimeavtale):
- 408590000: 🆓Ledig
- 408591000: ⚪Opptatt
- 408592000: 🟡Møtt opp
- 408593000: 🟢Vaksinert
- 408594000: 🔴Avvist
- 408594001: ⏰Ikke møtt
- 408594002: 🟩Vaksinert og sendt til Sysvak
- 408594003: ℹ️ Duplikat/Feilregistrering
- 408594004: ⛔Avlyst av virksomheten
- 408594005: 🟪Underavtale(r) vaksinert
```

**NHN Meldingsstatus:**
```
pasinfo_nhnmeldingsstatus:
- 469260000: 🟡 Venter
- 469260001: 🟢 Ok
- 469260002: 🔴 Avvist
```

---

#### 2. Vaksinetypes (sogv_vaksinetype)
**Formål:** Definerer tilgjengelige vaksinetyper

**Nøkkelfelt:**
- `sogv_vaksinetypeid` (GUID) - Primærnøkkel
- `sogv_name` (String) - Navn på vaksinetypen
- `sogv_visningsnavn` (String) - Visningsnavn for brukere
- `sogv_hovedtypevaksine` (Choice) - Hovedkategori
- `sogv_ansattrelatert` (Boolean) - Om vaksinen er tilgjengelig for ansattvaksinering
- `sogv_innbyggerrelatert` (Boolean) - Om vaksinen er tilgjengelig for innbyggervaksinering
- `sogv_egenandel` (Decimal) - Egenandel i kroner

**Preparat- og vaksinekodeverk (NHN/SYSVAK):**
- `sogv_vaksine_v` (String) - Vaksinekode V-register
- `sogv_vaksine_s` (String) - Vaksinekode S-register
- `sogv_vaksine_dn` (String) - Vaksinekode DN-register
- `sogv_preparat_v` (String) - Preparatkode V-register
- `sogv_preparat_s` (String) - Preparatkode S-register
- `sogv_preparat_dn` (String) - Preparatkode DN-register

**Customer Voice:**
- `sogv_msfp_project` (Lookup) - Tilknyttet tilfredsundersøkelsesprosjekt
- `sogv_msfp_survey` (Lookup) - Tilknyttet survey

**Hovedtyper:**
```
sogv_vaksinehovedtype (Vaksinekategori):
- 408590000: Influensa
- 408590001: Mpox
- 408590002: Korona
- 408590003: Meningokokk B
- 408590004: Meningokokk A
- 408590005: Korona + Influensa
- 408590006: Korona + Pneumokokk
- 408590007: Influensa + Pneumokokk
- 408590008: Korona + Influensa + Pneumokokk
- 408590009: Pneumokokk
- 408590010: Hepatitt A
```

---

#### 3. Contacts (contact)
**Formål:** Standard Dataverse kontakt-entitet for personer

**Relevante felt for vaksineapplikasjonen:**
- `contactid` (GUID) - Primærnøkkel
- `firstname` (String) - Fornavn
- `lastname` (String) - Etternavn
- `birthdate` (Date) - Fødselsdato
- `mobilephone` (String) - Mobiltelefon
- `emailaddress1` (String) - E-postadresse
- `address1_line1` (String) - Adresse
- `address1_city` (String) - By
- `address1_postalcode` (String) - Postnummer

**Integrasjoner:**
Kontakter opprettes/oppdateres basert på data fra:
- FIKS Folkeregisteret (navn, fødselsdato, adresse)
- KRR (mobilnummer, e-post)

---

#### 4. Accounts (account)
**Formål:** Organisasjoner/helseenheter som utfører vaksinering

**Nøkkelfelt:**
- `accountid` (GUID) - Primærnøkkel
- `name` (String) - Organisasjonsnavn
- `accountnumber` (String) - Organisasjonsnummer

**Business Type:**
- `VaccineCenter` - Vaksinesenter (for innbyggervaksinering)
- Andre typer for ansattvaksinering

**Views:**
- `Brukes av PasinfoVaksine applikasjonen` - Standard visning
- `Brukes av PasinfoVaksine applikasjonen AdminRolle` - Admin-visning (flere organisasjoner)

---

#### 5. Ansatt (pasinfo_ansatt)
**Formål:** Ansatte som utfører vaksineringer

**Nøkkelfelt:**
- `pasinfo_ansattid` (GUID) - Primærnøkkel
- `pasinfo_name` (String) - Navn
- `pasinfo_nin` (String) - Fødselsnummer
- `pasinfo_ansattnr` (String) - Ansattnummer
- `pasinfo_hprid` (String) - HPR-ID (Helsepersonellregisteret)
- `pasinfo_prkid` (String) - PRK-ID
- `pasinfo_Contact` (Lookup) - Kobling til Contact
- `pasinfo_Account` (Lookup) - Kobling til arbeidsgiver

**Arbeidssted:**
- `pasinfo_bydel` (String) - Bydel
- `pasinfo_koststed` (String) - Koststed
- `pasinfo_kostsenter` (String) - Kostsenter (skal slettes)

**Jobbinformasjon:**
- `pasinfo_jobtittelid` (String) - Jobtittel-ID
- `pasinfo_jobtittelbeskrivelse` (String) - Jobtittelbeskrivelse

**Vaksinerelatert:**
- `sogv_antallvaksiner` (Rollup) - Antall utførte vaksineringer

**Opprettelse:**
- `pasinfo_gangopprettetfra` (String) - Kilde for første gangs opprettelse

---

#### 6. VaksineInnbygger (sogv_vaksineinnbygger)
**Formål:** Innbyggerprofiler med vaksinerelatert informasjon

**Nøkkelfelt:**
- `sogv_vaksineinnbyggerid` (GUID) - Primærnøkkel
- `sogv_name` (String) - Navn
- `sogv_fnr` (String) - Fødselsnummer
- `emailaddress` (String) - E-postadresse
- `sogv_Contact` (Lookup) - Kobling til Contact

**Helsedeklarasjoner:**
- `sogv_tegnspraktolk` (Boolean) - Behov for tegnspråktolk
- `sogv_tidligereanafylaktiskreaksjonannenallergi` (Boolean) - Tidligere anafylaktiske reaksjoner/allergi

**Statistikk:**
- `sogv_antallvaksineringer` (Rollup) - Antall mottatte vaksineringer

**Opprettelse:**
- `sogv_gangopprettetfra` (String) - Kilde for opprettelse
- `sogv_id` (String) - Ekstern ID

---

#### 7. Registreringsgrunnlag (sogv_registreringsgrunnlag)
**Formål:** Grunnlag for å registrere vaksinering (egenerklæringer)

**Nøkkelfelt:**
- `sogv_registreringsgrunnlagid` (GUID) - Primærnøkkel
- `sogv_name` (String) - Beskrivelse av registreringsgrunnlaget

**Relasjoner:**
- Kobles til `Vaksinerings` via lookup
- Kobles til `Ansatt` for ansattvaksinering

**Eksempler på registreringsgrunnlag:**
- Egenerklæring om helse
- Samtykke til vaksinasjon
- Arbeidsgiversamtykke

---

#### 8. Sms utsendelser (sogv_smsutsendelser)
**Formål:** Sporing av utsendte SMS-er

**Nøkkelfelt:**
- `sogv_smsutsendelserid` (GUID) - Primærnøkkel
- `sogv_navn` (String) - Mottakernavn
- `sogv_mobilnummer` (String) - Mobilnummer
- `sogv_smstekst` (String) - SMS-tekst
- `sogv_Smstyper` (Lookup) - Type SMS
- `sogv_vaksinering` (Lookup) - Knyttet vaksineregistrering
- `sogv_timeavtale` (DateTime) - Knyttet timeavtale

**Status:**
- `sogv_smssent` (Boolean) - Om SMS er sendt
- `sogv_smssenttidspunkt` (DateTime) - Tidspunkt for sending

**ID-sporing:**
- `sogv_id` (String) - Ekstern ID fra SMS-tjeneste

---

#### 9. Sms typer (sogv_smstyper)
**Formål:** Maler for SMS-meldinger

**Nøkkelfelt:**
- `sogv_smstyperid` (GUID) - Primærnøkkel
- `sogv_name` (String) - Navn på SMS-type
- `sogv_smstekst` (String) - Mal for SMS-tekst

**Deprecated felter (erstattet med dynamisk tekst):**
- `sogv_smsmedtimeavtale` (Boolean) - SMS inneholder timeavtale
- `sogv_smsmedgammeltimeavtale` (Boolean) - SMS inneholder gammel timeavtale
- `sogv_smsmedinitialer` (Boolean) - SMS inneholder initialer
- `sogv_smsmedcv` (Boolean) - SMS inneholder CV

**Eksempler på SMS-typer:**
- Bekreftelse på timeavtale
- Påminnelse om timeavtale
- Avlysning av timeavtale
- OTP (engangspassord) for verifisering

---

#### 10. Notes (annotation)
**Formål:** Standard Dataverse notater-entitet

**Nøkkelfelt:**
- `annotationid` (GUID) - Primærnøkkel
- `subject` (String) - Emne
- `notetext` (String) - Notattekst
- `objectid` (Lookup) - Knyttet til objekt (typisk Vaksinerings)
- `filename` (String) - Eventuelt vedlegg
- `documentbody` (String) - Base64-kodet dokumentinnhold

**Bruk i vaksineapplikasjonen:**
- Notater på vaksinasjoner
- Dokumentasjon av avvik
- Merknad om pasientens tilstand

---

#### 11. Vaksinehovedtype (sogv_vaksinehovedtype)
**Formål:** Kategorisering av vaksinehovedtyper

**Nøkkelfelt:**
- `sogv_vaksinehovedtypeid` (GUID) - Primærnøkkel
- `sogv_name` (String) - Navn på hovedtype
- `sogv_hovedtypevaksine` (Choice) - Kategorikode
- `sogv_ansattrelatert` (Boolean) - Tilgjengelig for ansattvaksinering
- `sogv_innbyggerrelatert` (Boolean) - Tilgjengelig for innbyggervaksinering

**Funksjon:**
Definerer hvilke vaksinehovedtyper som er aktive og tilgjengelige for ulike brukergrupper.

---

#### 12. Ansattoversikt basert på lønn (sogv_ansattoversiktbasertpalonn)
**Formål:** Oversikt over ansatte basert på lønnsdata

**Nøkkelfelt:**
- `sogv_ansattoversiktbasertpalonnid` (GUID) - Primærnøkkel
- `sogv_lonnsperiode` (String) - Lønnsperiode

**Bruk:**
Brukes for å sette global variabel `Lonnsperiode` ved appstart.

---

#### 13. Users (systemuser)
**Formål:** Standard Dataverse bruker-entitet

**Nøkkelfelt:**
- `systemuserid` (GUID) - Primærnøkkel
- `fullname` (String) - Fullt navn
- `internalemailaddress` (String) - E-postadresse
- `azureactivedirectoryobjectid` (GUID) - Azure AD Object ID

**Bruk:**
- Identifikasjon av pålogget bruker
- Sporing av hvem som opprettet/endret poster
- Tilgangskontroll

---

#### 14. Environment Variable Definitions (environmentvariabledefinition)
**Formål:** Miljøvariabler for konfigurasjon

**Nøkkelvariable:**
- `sogv_AdminAdGruppe` - Azure AD gruppe-ID for administratorer
- `sogv_AnsattVaksineAdGruppe` - Azure AD gruppe-ID for ansattvaksinering
- `sogv_InnbyggerVaksineAdGruppe` - Azure AD gruppe-ID for innbyggervaksinering

**Felttyper:**
- `schemaname` (String) - Skjemanavn
- `defaultvalue` (String) - Standardverdi
- `type` (Choice) - Datatype (String/Number/Boolean/JSON/Data Source/Secret)

---

#### 15. Customer Voice-entiteter

**Customer Voice survey invites (msfp_surveyinvite):**
- Invitasjoner til tilfredsundersøkelser
- Knyttet til vaksinasjoner

**Customer Voice survey responses (msfp_surveyresponse):**
- Svar fra tilfredsundersøkelser
- Tilbakemelding fra innbyggere

**Customer Voice survey questions (msfp_question):**
- Spørsmål i undersøkelser

---

## Applikasjonsfunksjonalitet

### Oppstartslogikk (OnStart)

Ved applikasjonsstart utføres følgende:

1. **Tema-initialisering:**
   ```javascript
   Set(AppTheme, {
       palette: {
           themePrimary: "#034B45",
           // ... flere farger
       }
   })
   ```

2. **Henting av miljøvariabler:**
   ```javascript
   Set(AdminAdGruppe, LookUp('Environment Variable Definitions',
       'Schema Name' = "sogv_AdminAdGruppe", 'Default Value'))
   Set(AnsattVaksineAdGruppe, LookUp('Environment Variable Definitions',
       'Schema Name' = "sogv_AnsattVaksineAdGruppe", 'Default Value'))
   Set(InnbyggerVaksineAdGruppe, LookUp('Environment Variable Definitions',
       'Schema Name' = "sogv_InnbyggerVaksineAdGruppe", 'Default Value'))
   ```

3. **Tilgangskontroll via Graph API:**
   ```javascript
   Set(Innbyggervaksinering, IfError(
       !IsEmpty(Graph.checkMemberGroups(
           User().EntraObjectId,
           {'$filter': "id eq '" & InnbyggerVaksineAdGruppe & "'"}
       ).value),
       false
   ))

   Set(Ansattvaksinering, IfError(
       !IsEmpty(Graph.checkMemberGroups(
           User().EntraObjectId,
           {'$filter': "id eq '" & AnsattVaksineAdGruppe & "'"}
       ).value),
       false
   ))

   Set(Admin, IfError(
       !IsEmpty(Graph.checkMemberGroups(
           User().EntraObjectId,
           {'$filter': "id eq '" & AdminAdGruppe & "'"}
       ).value),
       false
   ))
   ```

4. **Konfigurasjon av tilgjengelige vaksinetyper:**
   ```javascript
   Set(TillatteHovedtyper, Filter(
       [@Vaksinehovedtype],
       Status = 'Status (Vaksinehovedtype)'.Active &&
       (
           (Ansattvaksinering && 'Ansattrelatert hovedtype') ||
           (Innbyggervaksinering && 'Innbyggerrelatert hovedtype')
       )
   ))
   ```

5. **Andre initialiseringer:**
   ```javascript
   Set(VaskineringToggle, If(Admin Or (Innbyggervaksinering And Ansattvaksinering), true, false))
   Set(Lonnsperiode, LookUp(SortByColumns('Ansattoversikt basert på lonn', "sogv_lonnsperiode"), 1=1, Lønnsperiode))
   Set(IsProcessing, false)
   ```

---

### Hovedmeny-skjerm

#### Komponenter

**Header:**
- Oslo Kommune logo
- Tittel: "PASINFO VAKSINE"
- Oppdateringsknapp (refresh Vaksinerings-data)
- Versjonsinformasjon: "Powered by Pasinfo ver. 2.06"

**Organisasjonsvalg:**
- TabList med tilgjengelige organisasjoner (Accounts)
- Filtreres basert på brukerrolle (Admin får flere organisasjoner)
- Ved valg av organisasjon settes variablene:
  - `Innbyggervaksinering` eller `Ansattvaksinering` basert på Account.BusinessType

**Funksjonsmeny:**
1. **Timebooking og vaksinering** (Primærknapp)
   - Navigerer til `Screen_Hoved`
   - Setter `NySesjon = true`

2. **Etterregistering av vaksiner satt annet sted** (Foreløpig skjult)
   - For registrering av vaksiner gitt utenfor systemet

**Rolletilpasser:**
- Toggle for å bytte mellom innbygger- og ansattvaksinering (kun for Admin/brukere med begge roller)
- Vises kun hvis `VaskineringToggle = true`

**Feilhåndtering:**
- Ikon som vises hvis bruker ikke har noen rolle tildelt
- Forhindrer tilgang til funksjonalitet

---

### Hovedarbeidsflate (Screen_Hoved)

Hovedskjermen er delt inn i flere funksjonsområder:

#### 1. Header

**Innhold:**
- Tilbakeknapp til hovedmeny
- Organisasjonsnavn
- Teller for ledige timer (filtrert på dato, kategori, status)
- Teller for opptatte timer
- Datofilter-indikasjon
- Oppdateringsknapp

**Logikk for telling:**
```javascript
// Ledige timer
CountRows(Filter(
    Vaksinerings,
    IsBlank(VaksineringParent) And
    Timeavtale >= [FiltrertDato] And
    Timeavtale <= DateAdd([FiltrertDato], 1) And
    ThisRecord.'Hovedtype vaksine' in ComboboxKategori.SelectedItems And
    ThisRecord.Account.Account = GUID(TabListAccount.Selected.Account) And
    IsBlank(Fnr) And
    ThisRecord.Status = 0
))
```

#### 2. Søkeområde

**Søkefelt:**
- **Navn eller FNR:** Tekstinput for søk
- **Fødselsdato:** Valgfritt felt for å presisere søk (format: DDMMYY)
- **Søkeknapp:** Trigge søk mot FIKS Folkeregisteret

**Søkelogikk:**
```javascript
// Hvis navn og fødselsdato
If(CountRows(Split(NavnFnrInput.Text, " ")) > 1 Or
   (Len(NavnFnrInput.Text) > 4 && Not(IsBlank(FDataInput.Text))),

   UpdateContext({
       PersonSoekResponse: FiksFolkeregisteret.Personsoek({
           navn: NavnFnrInput.Text,
           foedselsdato: [Formatert fødselsdato YYYYMMDD]
       }).foedselsEllerDNummer
   })
)
```

**Spesialfunksjoner:**
1. **Person uten norsk FNR/D-nummer:**
   - Åpner dialog for manuell registrering
   - Kun for innbyggervaksinering
   - Setter `HarIkkeFnr = true`

2. **Invitasjon innbyggerbooking:**
   - Åpner dialog for å sende invitasjon til selvbooking
   - Kun for innbyggervaksinering

#### 3. Personresultat-tabell (PersonTabell)

**Fluent Details List komponent** som viser søkeresultater:

**Kolonner:**
- Navn (300px)
- Født (100px) - Fødselsdato
- Mobil (100px) - Fra KRR
- Epost (200px) - Fra KRR
- Alder (100px) - Beregnet

**Datakilder:**
```javascript
AddColumns(
    // Hvis FNR angitt direkte
    If(Len(PersonSoekFnrHolder.Text) = 11 And IsNumeric(PersonSoekFnrHolder.Text),
        Split(PersonSoekFnrHolder.Text, "!!!@@@???abcABC"),
        PersonSoekResponse
    ),
    FregDataRaw, FiksFolkeregisteret.HentSisteVersjonAvPerson(ThisRecord.Value),
    KrrDataRaw, Krr.Person(ThisRecord.Value),
    Navn, [Formatert navn fra FIKS],
    Dob, [Fødselsdato],
    Mobil, [Fra KRR],
    Epost, [Fra KRR],
    Alder, [Beregnet alder]
)
```

**Funksjonalitet:**
- Klikk på rad setter `SelectedPerson`
- Automatisk oppslag av:
  - Persondata fra FIKS Folkeregisteret
  - Kontaktinformasjon fra KRR
  - Eksisterende vaksineringer i Dataverse

#### 4. Vaksinasjonsregistrering

(Basert på valgt person)

**Vaksinevalg:**
- Dropdown/Combobox for vaksinetype
- Filtreres på:
  - `TillatteHovedtyper` (basert på rolle)
  - Aktive vaksinetyper
  - Ansatt/Innbygger-relatert

**Timeavtalevalg:**
- Datovalg
- Tidsvalg
- Timeboktype (Timeavtale/DropIn/Barn/Feltvaksinering)

**Registreringsdetaljer:**
- Batchnummer
- Ansvarlig helsepersonell
- Registreringsgrunnlag (egenerklæringer)
- Årsak til vaksinering
- Merknadsfelt

**Lagring:**
Oppretter ny `Vaksinerings`-post med:
- Personinformasjon (FNR, navn, kontaktinfo)
- Valgt vaksinetype
- Timeavtale
- Registreringsdetaljer
- Automatisk satt status

#### 5. Filtreringsområde

**Datofilter:**
- Datovalg (DropdownDato)
- Checkbox for "Kun i dag"
- Checkbox for "Fra kl 12:00"

**Kategorifilter:**
- Combobox for vaksinehovedtyper
- Multiselect

**Timeboktype-filter:**
- Combobox for timeboktype
- Multiselect

**Statusfilter:**
- Combobox for vaksineringsstatus
- Multiselect

**Søkefelt:**
- SearchBox for fritekstsøk i navn/FNR

#### 6. Timeoversikt

**Fluent Details List** med kolonner:
- Timeavtale
- Navn
- Fødselsdato/FNR
- Vaksinetype
- Status
- Notater
- Handlinger

**Funksjonalitet:**
- Klikk for å åpne detaljer
- Markeringsmulighet for bulkoperasjoner
- Sortering på kolonner
- Filtrering basert på filtreringsområdet

---

### Person uten FNR-dialog

For personer uten norsk fødselsnummer eller D-nummer:

**Inputfelt:**
- Fornavn
- Etternavn
- Fødselsdato (DatePicker)
- Mobilnummer
- E-post

**Funksjonalitet:**
- Oppretter `VaksineInnbygger` uten FNR
- Oppretter midlertidig ID
- Kobler til vaksinering
- Begrensninger i SYSVAK-rapportering

---

### Innbyggerbooking-invitasjon

Dialog for å sende invitasjon til selvbooking:

**Funksjonalitet:**
- Hent personinformasjon
- Generer unik invitasjons-URL
- Send SMS/e-post med lenke
- Spor invitasjoner

---

## Sikkerhet og tilgangskontroll

### Rollebasert tilgang

**Tre hovedroller definert via Azure AD-grupper:**

1. **Administrator (Admin)**
   - Full tilgang til alle funksjoner
   - Se alle organisasjoner
   - Bytte mellom innbygger- og ansattvaksinering
   - Definert via: `sogv_AdminAdGruppe` miljøvariabel

2. **Ansattvaksinering (Ansattvaksinering)**
   - Tilgang til ansattvaksinering
   - Se ansattrelaterte vaksinetyper
   - Begrenset til spesifikke organisasjoner
   - Definert via: `sogv_AnsattVaksineAdGruppe` miljøvariabel

3. **Innbyggervaksinering (Innbyggervaksinering)**
   - Tilgang til innbyggervaksinering
   - Se innbyggerrelaterte vaksinetyper
   - Tilgang til innbyggerbooking
   - Definert via: `sogv_InnbyggerVaksineAdGruppe` miljøvariabel

### Tilgangskontrollmekanismer

**Ved appstart:**
```javascript
// Sjekk gruppetilhørighet
Set(Innbyggervaksinering, IfError(
    !IsEmpty(Graph.checkMemberGroups(
        User().EntraObjectId,
        {'$filter': "id eq '" & InnbyggerVaksineAdGruppe & "'"}
    ).value),
    false
))
```

**Filtrering av data:**
- Accounts filtreres basert på rolle
- Vaksinetyper filtreres basert på `ansattrelatert`/`innbyggerrelatert`
- Views i Dataverse begrenser datatilgang

### Dataverse sikkerhet

**Sikkerhetslag:**
1. **Miljønivå:** Azure AD-autentisering
2. **Applikasjonsnivå:** Power Apps-sikkerhetsroller
3. **Radnivå:** Owner-basert sikkerhet på entiteter
4. **Feltnivå:** Field-level security på sensitive felt

**Sensitive data:**
- Fødselsnummer (`sogv_fnr`) - Kryptert ved lagring
- Mobilnummer - Hentet fra KRR, ikke lagret permanent
- E-post - Hentet fra KRR, ikke lagret permanent

### Logging og revisjon

**Automatisk sporing:**
- `createdby` - Hvem opprettet posten
- `createdon` - Når ble posten opprettet
- `modifiedby` - Hvem endret posten sist
- `modifiedon` - Når ble posten endret sist

**Spesiell logging:**
- SMS-utsendelser spores i `Sms utsendelser`
- SYSVAK-rapportering spores med tidsstempler
- Notater på vaksinasjoner for avvikshåndtering

---

## Dataflyt

### 1. Personsøk og vaksinering (Hovedflyt)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Bruker søker etter person (Navn/FNR + fødselsdato)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FIKS Folkeregisteret - Personsoek                         │
│    - Input: navn, foedselsdato                               │
│    - Output: Liste over fødselsnummer                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. For hver treff: Parallelle API-kall                       │
│    A) FIKS - HentSisteVersjonAvPerson(FNR)                  │
│       → Navn, adresse, fødselsdato                           │
│    B) KRR - Person(FNR)                                      │
│       → Mobilnummer, e-post                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Vis resultat i PersonTabell (Fluent Details List)        │
│    - Kombinert data fra FIKS + KRR                           │
│    - Beregn alder                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Bruker velger person                                      │
│    → Set SelectedPerson                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Sjekk/opprett relaterte poster                            │
│    A) Contact (Dataverse)                                    │
│       - Søk på FNR                                           │
│       - Opprett/oppdater med FIKS+KRR data                   │
│    B) VaksineInnbygger (hvis innbyggervaksinering)           │
│       - Søk på FNR                                           │
│       - Opprett hvis ikke finnes                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Velg vaksinetype og timeavtale                            │
│    - Filtrert på TillatteHovedtyper                          │
│    - Velg dato/tid                                           │
│    - Velg timeboktype                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Registrer vaksinering                                     │
│    Patch(Vaksinerings, Defaults(Vaksinerings), {             │
│        sogv_fnr: SelectedPerson.FNR,                         │
│        sogv_name: SelectedPerson.Navn,                       │
│        sogv_Vaksinetype: SelectedVaksinetype,                │
│        sogv_timeavtale: SelectedTimeavtale,                  │
│        sogv_Account: TabListAccount.Selected,                │
│        sogv_Contact: Contact,                                │
│        sogv_VaksineInnbygger: VaksineInnbygger,              │
│        sogv_vaksineringstatus: Ledig/Opptatt,                │
│        ...                                                   │
│    })                                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Valgfrie tilleggshandlinger                               │
│    - Legg til notater                                        │
│    - Send SMS-bekreftelse                                    │
│    - Registrer egenerklæringer                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Vaksineutførelse og SYSVAK-rapportering

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Helsepersonell finner timeavtale                          │
│    - Filtrer på dato, status, organisasjon                   │
│    - Søk på navn/FNR                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Åpne timeavtale                                           │
│    - Vis persondetaljer                                      │
│    - Vis vaksinetype                                         │
│    - Vis tidligere vaksiner                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Verifiser person                                          │
│    - Sjekk legitimasjon                                      │
│    - Bekreft fødselsnummer                                   │
│    - Set sogv_verifikasjonavfeilfnr = true                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Registrer egenerklæringer                                 │
│    - Allergi/anafylaksi                                      │
│    - Gravid (hvis relevant)                                  │
│    - Andre helseforhold                                      │
│    - Koble til Registreringsgrunnlag                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Utfør vaksinasjon                                         │
│    Patch(Vaksinerings, TimeavtaleRecord, {                   │
│        sogv_vaksineersatt: true,                             │
│        sogv_batchnummer: [Batchnummer],                      │
│        sogv_vaksinesattav: [Initialer/navn],                 │
│        sogv_ansvarliglege: [Lege],                           │
│        sogv_konsultasjonsdato: Now(),                        │
│        sogv_vaksineringstatus: Vaksinert (408593000),        │
│        sogv_pasinfo_Ansatt: [Ansatt-record],                 │
│        ...                                                   │
│    })                                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Automatisk backend-prosess (Flow/Plugin)                  │
│    - Trigger: sogv_vaksineersatt = true                      │
│    - Validering av data                                      │
│    - Klargjøring av SYSVAK-melding                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Send til SYSVAK (NHN)                                     │
│    - Formatér melding iht. SYSVAK-standard                   │
│    - Send via sikker kanal                                   │
│    - Set sogv_sendttilsysvak = Now()                         │
│    - Set sogv_nhnmeldingsstatus = Venter (469260000)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Motta respons fra SYSVAK                                  │
│    A) Godkjent:                                              │
│       - sogv_bekreftetmottattavsysvak = Now()                │
│       - sogv_nhnmeldingsstatus = Ok (469260001)              │
│       - sogv_vaksineringstatus = Vaksinert og sendt til      │
│         Sysvak (408594002)                                   │
│    B) Avvist:                                                │
│       - sogv_nhnmeldingsstatus = Avvist (469260002)          │
│       - sogv_feilmeldingfrasysvak = [Feilmelding]            │
│       - Varsling til helsepersonell                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Valgfri oppfølging                                        │
│    - Send tilfredsundersøkelse (Customer Voice)              │
│    - SMS-bekreftelse til innbygger                           │
│    - Oppdater statistikk (rollup-felt)                       │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. SMS-varsling

```
┌─────────────────────────────────────────────────────────────┐
│ Trigger: Diverse hendelser                                   │
│ - Timeavtale opprettet                                       │
│ - Påminnelse (24 timer før)                                  │
│ - Timeavtale avlyst                                          │
│ - OTP for verifisering                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Hent mobilnummer                                          │
│    - Primært fra KRR.Person(FNR)                             │
│    - Sekundært fra Contact.mobilephone                       │
│    - Manuelt registrert på Vaksinerings                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Hent SMS-mal                                              │
│    LookUp(Sms typer, sogv_name = "Bekreftelse")              │
│    → sogv_smstekst                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Personaliser SMS-tekst                                    │
│    - Erstatt {NAVN} med personens navn                       │
│    - Erstatt {TIMEAVTALE} med dato/tid                       │
│    - Erstatt {VAKSINE} med vaksinetype                       │
│    - Erstatt andre plassholdere                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Opprett Sms utsendelser-post                              │
│    Patch(Sms utsendelser, Defaults(Sms utsendelser), {       │
│        sogv_navn: Person.navn,                               │
│        sogv_mobilnummer: Mobilnummer,                        │
│        sogv_smstekst: PersonalisertTekst,                    │
│        sogv_Smstyper: SmsType,                               │
│        sogv_vaksinering: VaksineringRecord,                  │
│        sogv_timeavtale: Timeavtale,                          │
│        sogv_smssent: false                                   │
│    })                                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend-prosess (Flow) sender SMS                         │
│    - Trigger: Ny Sms utsendelser hvor sogv_smssent = false   │
│    - Kall SMS-gateway API (eks. Twilio, Link Mobility)       │
│    - Motta message-ID fra gateway                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Oppdater Sms utsendelser                                  │
│    Patch(Sms utsendelser, SmsRecord, {                       │
│        sogv_smssent: true,                                   │
│        sogv_smssenttidspunkt: Now(),                         │
│        sogv_id: MessageId                                    │
│    })                                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Oppdater Vaksinerings-post                                │
│    Patch(Vaksinerings, VaksineringRecord, {                  │
│        sogv_smsbekreftelsesendt: true,                       │
│        sogv_smsbekreftelsesendttil: Mobilnummer              │
│    })                                                        │
│    (Felt varierer basert på SMS-type)                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Innbyggerbooking (Selvbetjening)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Innbygger mottar invitasjon                               │
│    - SMS eller e-post med unik lenke                         │
│    - Lenke til Power Apps Portal eller selvstendige app      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Autentisering                                             │
│    - ID-porten (BankID/MinID)                                │
│    - Eller OTP til mobilnummer                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Hent tilgjengelige timer                                  │
│    Filter(Vaksinerings,                                      │
│        sogv_innbyggerbooking = true,                         │
│        sogv_vaksineringstatus = Ledig (408590000),           │
│        sogv_timeavtale >= Now(),                             │
│        sogv_Account = [Valgt vaksinesenter],                 │
│        sogv_hovedtypevaksine in [Tillatte for innbygger]     │
│    )                                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Innbygger velger time                                     │
│    - Velg dato                                               │
│    - Velg tid fra ledige                                     │
│    - Velg vaksinetype (hvis flere tilgjengelig)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Reservasjon (midlertidig lock)                            │
│    Patch(Vaksinerings, ValgtTime, {                          │
│        sogv_reserverttid: DateAdd(Now(), 15, Minutes),       │
│        sogv_reservertsession: [SessionID]                    │
│    })                                                        │
│    Automatisk utløp etter 15 minutter                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Fyll ut egenerklæring                                     │
│    - Allergi/anafylaksi                                      │
│    - Gravid (hvis relevant)                                  │
│    - Aksept av personvernserklæring                          │
│    - Samtykke til vaksinasjon                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Bekreft booking                                           │
│    Patch(Vaksinerings, ValgtTime, {                          │
│        sogv_fnr: User().FNR,                                 │
│        sogv_name: User().FullName,                           │
│        sogv_mobilnummer: User().Mobile,                      │
│        sogv_vaksineringstatus: Opptatt (408591000),          │
│        sogv_booketavinnbygger: true,                         │
│        sogv_VaksineInnbygger: [VaksineInnbygger-record],     │
│        sogv_Registreringsgrunnlag: [Egenerklæring],          │
│        sogv_reserverttid: Blank(),                           │
│        sogv_reservertsession: Blank()                        │
│    })                                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Bekreftelse                                               │
│    - Vis bekreftelsesside med timedetaljer                   │
│    - Send SMS-bekreftelse                                    │
│    - Send e-postbekreftelse                                  │
│    - Kalenderinvitasjon (ICS-fil)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Teknisk konfigurasjon

### Power Apps-innstillinger

**App-type:** Canvas App
**Dokumenttype:** DesktopOrTablet
**Orientering:** Landscape
**Dimensjoner:** 1366 x 768

**Funksjoner aktivert:**
- `dataflowanalysisenabled: true`
- `dataverseactionsenabled: true`
- `delaycontrolrendering: true`
- `delayloadscreens: true`
- `enableonstart: true`
- `errorhandling: true`
- `formuladataprefetch: true`
- `nativecdsexperimental: true`
- `pdffunction: true`
- `useexperimentalcdsconnector: true`

**PCF Controls (3rd party):**
- `cat_PowerCAT.FluentDetailsList` - Tabell-komponent
- `cat_PowerCAT.SearchBox` - Søkeboks-komponent
- `cat_PowerCAT.Icon` - Ikon-komponent
- `nd_NghiemDoan.responsiveIframePCFControl` - IFrame-komponent

### Dataverse-konfigurasjon

**Database:** default.cds (Environmental)
**Max Rows:** 900 (Standard for alle entiteter)

**Custom Actions:**
Definert i Dataverse for integrasjon med eksterne systemer:
- `pasinfo_fiksfolkeregisteretv2` - FIKS API
- `pasinfo_kontaktreservasjonv2` - KRR API
- `new_5Fvaksinering-20` - Vaksinerings-API
- `pasinfo_5Fgraphapi-5Fbrukeradmin` - Graph API

**Rollup-felt (Beregnet):**
- `sogv_antallnotater` (på Vaksinerings) - Teller relaterte Notes
- `sogv_antallvaksineringer` (på VaksineInnbygger) - Teller relaterte Vaksinerings
- `sogv_antallvaksiner` (på Ansatt) - Teller utførte vaksineringer

### Environment Variables

Kritiske miljøvariabler (må konfigureres per miljø):

| Schema Name | Beskrivelse | Type | Eksempel |
|------------|-------------|------|----------|
| `sogv_AdminAdGruppe` | Azure AD gruppe-ID for administratorer | String | `a1b2c3d4-...` |
| `sogv_AnsattVaksineAdGruppe` | Azure AD gruppe-ID for ansattvaksinering | String | `e5f6g7h8-...` |
| `sogv_InnbyggerVaksineAdGruppe` | Azure AD gruppe-ID for innbyggervaksinering | String | `i9j0k1l2-...` |

**Andre mulige miljøvariabler** (ikke direkte referert i koden, men sannsynlig brukt i backend):
- SYSVAK API-endpoint
- SMS-gateway konfigurasjon
- FIKS API endpoint/credentials
- KRR API endpoint/credentials

### Power Automate Flows (Antatt)

Selv om ikke direkte synlig i app-koden, er følgende flows sannsynlig basert på funksjonalitet:

1. **SMS-utsending**
   - Trigger: Ny `Sms utsendelser` hvor `sogv_smssent = false`
   - Aksjon: Send SMS via gateway, oppdater status

2. **SYSVAK-rapportering**
   - Trigger: `Vaksinerings` oppdatert med `sogv_vaksineersatt = true`
   - Aksjon: Valider, formatér, send til SYSVAK, oppdater status

3. **SYSVAK-respons**
   - Trigger: Webhook fra SYSVAK
   - Aksjon: Oppdater `sogv_nhnmeldingsstatus` og relaterte felt

4. **Påminnelser**
   - Trigger: Scheduled (daglig)
   - Aksjon: Finn avtaler neste dag, send påminnelse-SMS

5. **Reservasjonsutløp**
   - Trigger: Scheduled (hvert 5. minutt)
   - Aksjon: Finn utgåtte reservasjoner (`sogv_reserverttid < Now()`), nullstill

6. **Customer Voice**
   - Trigger: `Vaksinerings` status = Vaksinert og sendt til Sysvak
   - Aksjon: Send survey-invitasjon

### Sikkerhetskonfigurasjon

**Azure AD:**
- App-registrering med API-permissions:
  - Microsoft Graph: `User.Read`, `GroupMember.Read.All`
  - Dataverse: `user_impersonation`
- Tre sikkerhetsgrupper for rollehåndtering

**Dataverse Security Roles:**
- **Pasinfo Vaksine Admin** - Full tilgang
- **Pasinfo Vaksine Ansattvaksinering** - Begrenset til ansattvaksinering
- **Pasinfo Vaksine Innbyggervaksinering** - Begrenset til innbyggervaksinering
- **Pasinfo Vaksine Portal User** - For selvbetjening (hvis portal brukes)

**Field-level security:**
- `sogv_fnr` - Kun tilgjengelig for autoriserte brukere
- `sogv_batchnummer` - Kun redigerbar av helsepersonell
- Sensitive helseopplysninger i notater

---

## Vedlegg

### A. Statusverdier - Komplett oversikt

**sogv_vaksineringstatus (Status for timeavtale):**
| Verdi | Navn | Emoji | Beskrivelse |
|-------|------|-------|-------------|
| 408590000 | Ledig | 🆓 | Timen er åpen for booking |
| 408591000 | Opptatt | ⚪ | Timen er booket, men person ikke møtt |
| 408592000 | Møtt opp | 🟡 | Person har møtt, men ikke vaksinert ennå |
| 408593000 | Vaksinert | 🟢 | Vaksinasjon utført, ikke sendt til SYSVAK |
| 408594000 | Avvist | 🔴 | Person ble avvist (kontraindikasjon e.l.) |
| 408594001 | Ikke møtt | ⏰ | Person møtte ikke til avtalen |
| 408594002 | Vaksinert og sendt til Sysvak | 🟩 | Fullført og rapportert |
| 408594003 | Duplikat/Feilregistrering | ℹ️ | Ugyldig registrering |
| 408594004 | Avlyst av virksomheten | ⛔ | Virksomheten avlyste timen |
| 408594005 | Underavtale(r) vaksinert | 🟪 | For kombinasjonsvaksiner |

**sogv_nhnmeldingsstatus (NHN Meldingsstatus):**
| Verdi | Navn | Emoji | Beskrivelse |
|-------|------|-------|-------------|
| 469260000 | Venter | 🟡 | Sendt til SYSVAK, venter på svar |
| 469260001 | Ok | 🟢 | Godkjent av SYSVAK |
| 469260002 | Avvist | 🔴 | Avvist av SYSVAK |

**sogv_arsaktilvaksinering (Årsak til vaksinering):**
| Verdi | Beskrivelse |
|-------|-------------|
| 408590000 | Helsepersonell (med pasientkontakt) |
| 408590001 | Risikogruppe |
| 408590002 | Annet (som ikke faller inn under helsepersonell eller risikogruppe) |
| 408590003 | Ukjent (når man ikke vet årsak til vaksinering) |

**sogv_timeboktype (Timeboktype):**
| Verdi | Beskrivelse |
|-------|-------------|
| 408590000 | Barn |
| 408590001 | DropIn |
| 408590002 | Timeavtale |
| 408590003 | Feltvaksinering |

**sogv_triagegruppe (Triagegruppe):**
| Verdi | Emoji | Beskrivelse |
|-------|-------|-------------|
| 0 | 🔹 | Normal prioritet |
| 1 | ⚠️ | Høy prioritet/oppfølging nødvendig |

### B. API-endepunkter

**FIKS Folkeregisteret API:**
- Base URL: [Definert via Custom Connector]
- Autentisering: OAuth 2.0 / API-nøkkel
- Operasjoner:
  - `POST /personsoek` - Søk etter personer
  - `GET /person/{fnr}` - Hent persondetaljer

**KRR (Kontakt- og reservasjonsregisteret):**
- Base URL: [Definert via Custom Connector]
- Autentisering: Maskinporten / OAuth 2.0
- Operasjoner:
  - `GET /person/{fnr}` - Hent kontaktinformasjon

**SYSVAK (Systemet for vaksinering):**
- Base URL: [Definert i backend]
- Autentisering: Virksomhetssertifikat
- Protokoll: HL7 FHIR eller proprietært format
- Operasjoner (via backend):
  - Send vaksinasjonsmelding
  - Motta kvittering/avvisning

**Microsoft Graph API:**
- Base URL: `https://graph.microsoft.com/v1.0`
- Autentisering: Azure AD App Registration
- Operasjoner:
  - `POST /users/{id}/checkMemberGroups` - Sjekk gruppetilhørighet

### C. Datamodell-diagram

```
┌─────────────────────┐
│     Accounts        │
│  (Organisasjoner)   │
└──────────┬──────────┘
           │ 1
           │
           │ N
┌──────────▼──────────────────────────────────────┐
│              Vaksinerings                        │
│           (Hovedentitet)                         │
└──┬───┬───┬───┬───┬───┬───┬───┬───┬───┬────────┘
   │   │   │   │   │   │   │   │   │   │
   │   │   │   │   │   │   │   │   │   │
   │   │   │   │   │   │   │   │   │   └─────────────┐
   │   │   │   │   │   │   │   │   │                 │ N
   │   │   │   │   │   │   │   │   │                 │
   │   │   │   │   │   │   │   │   │         ┌───────▼────────┐
   │   │   │   │   │   │   │   │   │         │  Sms utsendelser│
   │   │   │   │   │   │   │   │   │         └────────────────┘
   │   │   │   │   │   │   │   │   │
   │   │   │   │   │   │   │   │   └──────────────┐
   │   │   │   │   │   │   │   │                  │ N
   │   │   │   │   │   │   │   │                  │
   │   │   │   │   │   │   │   │          ┌───────▼────────┐
   │   │   │   │   │   │   │   │          │     Notes       │
   │   │   │   │   │   │   │   │          │   (Notater)     │
   │   │   │   │   │   │   │   │          └─────────────────┘
   │   │   │   │   │   │   │   │
   │   │   │   │   │   │   │   └───────────────┐
   │   │   │   │   │   │   │                   │ N
   │   │   │   │   │   │   │                   │
   │   │   │   │   │   │   │           ┌───────▼────────────┐
   │   │   │   │   │   │   │           │ Customer Voice     │
   │   │   │   │   │   │   │           │ Survey Invites     │
   │   │   │   │   │   │   │           └────────────────────┘
   │   │   │   │   │   │   │
   │   │   │   │   │   │   └──────────────────┐
   │   │   │   │   │   │                      │ 1
   │   │   │   │   │   │              ┌───────▼────────┐
   │   │   │   │   │   │              │  Vaksinetypes   │
   │   │   │   │   │   │              └─────────────────┘
   │   │   │   │   │   │
   │   │   │   │   │   └─────────────────────┐
   │   │   │   │   │                         │ 1
   │   │   │   │   │                 ┌───────▼────────┐
   │   │   │   │   │                 │ Registrerings-  │
   │   │   │   │   │                 │    grunnlag     │
   │   │   │   │   │                 └─────────────────┘
   │   │   │   │   │
   │   │   │   │   └────────────────────────┐
   │   │   │   │                            │ 1
   │   │   │   │                    ┌───────▼────────┐
   │   │   │   │                    │     Ansatt      │
   │   │   │   │                    └─────────────────┘
   │   │   │   │
   │   │   │   └───────────────────────────┐
   │   │   │                               │ 1
   │   │   │                       ┌───────▼────────┐
   │   │   │                       │ VaksineInnbygger│
   │   │   │                       └─────────────────┘
   │   │   │
   │   │   └──────────────────────────────┐
   │   │                                  │ 1
   │   │                          ┌───────▼────────┐
   │   │                          │    Contacts     │
   │   │                          └─────────────────┘
   │   │
   │   └─────────────────────────────────┐
   │                                     │ N (Hierarki)
   │                             ┌───────▼────────────┐
   │                             │   Vaksinerings     │
   │                             │  (Underavtaler)    │
   │                             └────────────────────┘
   │
   └────────────────────────────────────┐
                                        │ 1
                                ┌───────▼────────┐
                                │  Sms typer      │
                                └─────────────────┘
```

### D. Integrasjonssekvensdiagram - SYSVAK-rapportering

```
Bruker    PowerApp    Dataverse    Flow      SYSVAK      NHN
  │           │           │          │          │          │
  │  Klikk    │           │          │          │          │
  │ "Sett     │           │          │          │          │
  │  vaksine" │           │          │          │          │
  ├──────────>│           │          │          │          │
  │           │           │          │          │          │
  │           │ Patch(    │          │          │          │
  │           │ Vaksine-  │          │          │          │
  │           │  rings,   │          │          │          │
  │           │ vaksine-  │          │          │          │
  │           │  ersatt   │          │          │          │
  │           │  = true)  │          │          │          │
  │           ├──────────>│          │          │          │
  │           │           │          │          │          │
  │           │           │ Trigger: │          │          │
  │           │           │ Record   │          │          │
  │           │           │ updated  │          │          │
  │           │           ├─────────>│          │          │
  │           │           │          │          │          │
  │           │           │          │ Valider  │          │
  │           │           │          │   data   │          │
  │           │           │          │          │          │
  │           │           │          │ Formatér │          │
  │           │           │          │ HL7 FHIR │          │
  │           │           │          │ melding  │          │
  │           │           │          │          │          │
  │           │           │          │ POST     │          │
  │           │           │          │ /vaksi-  │          │
  │           │           │          │ nasjon   │          │
  │           │           │          ├─────────>│          │
  │           │           │          │          │          │
  │           │           │          │          │ Valider  │
  │           │           │          │          │ mot      │
  │           │           │          │          │ Folke-   │
  │           │           │          │          │ register │
  │           │           │          │          ├─────────>│
  │           │           │          │          │          │
  │           │           │          │          │ OK       │
  │           │           │          │          │<─────────┤
  │           │           │          │          │          │
  │           │           │          │ 200 OK + │          │
  │           │           │          │ Message  │          │
  │           │           │          │   ID     │          │
  │           │           │          │<─────────┤          │
  │           │           │          │          │          │
  │           │           │ Patch(   │          │          │
  │           │           │ Vaksine- │          │          │
  │           │           │  rings,  │          │          │
  │           │           │ sendttil │          │          │
  │           │           │  sysvak= │          │          │
  │           │           │  Now(),  │          │          │
  │           │           │ meldings │          │          │
  │           │           │  status= │          │          │
  │           │           │ Venter)  │          │          │
  │           │           │<─────────┤          │          │
  │           │           │          │          │          │
  │           │           │          │          │ Async    │
  │           │           │          │          │ bekreft  │
  │           │           │          │ Webhook  │          │
  │           │           │          │ bekreft  │          │
  │           │           │          │<─────────┤          │
  │           │           │          │          │          │
  │           │           │ Patch(   │          │          │
  │           │           │ Vaksine- │          │          │
  │           │           │  rings,  │          │          │
  │           │           │ bekreftet│          │          │
  │           │           │  mottatt │          │          │
  │           │           │ =Now(),  │          │          │
  │           │           │ meldings │          │          │
  │           │           │  status= │          │          │
  │           │           │   Ok,    │          │          │
  │           │           │ status=  │          │          │
  │           │           │ Vaksinert│          │          │
  │           │           │  og sendt│          │          │
  │           │           │ til Sysvak)         │          │
  │           │           │<─────────┤          │          │
  │           │           │          │          │          │
```

### E. Rollup-felt konfigurasjon

**sogv_antallnotater (på Vaksinerings):**
- Kilde-entitet: `annotation` (Notes)
- Kildefelt: `annotationid`
- Filter: `objectid = currentrecord.sogv_vaksineringid`
- Aggregering: COUNT
- Oppdateringsfrekvens: Ved endring

**sogv_antallvaksineringer (på VaksineInnbygger):**
- Kilde-entitet: `sogv_vaksinering`
- Kildefelt: `sogv_vaksineringid`
- Filter: `sogv_VaksineInnbygger = currentrecord.sogv_vaksineinnbyggerid AND statecode = 0`
- Aggregering: COUNT
- Oppdateringsfrekvens: Ved endring

**sogv_antallvaksiner (på Ansatt):**
- Kilde-entitet: `sogv_vaksinering`
- Kildefelt: `sogv_vaksineringid`
- Filter: `sogv_pasinfo_Ansatt = currentrecord.pasinfo_ansattid AND sogv_vaksineersatt = true`
- Aggregering: COUNT
- Oppdateringsfrekvens: Ved endring

---

## Kontaktinformasjon og support

**Systemansvarlig:** Oslo Kommune
**Teknisk plattform:** Microsoft Power Platform
**Versjon:** 2.06
**Sist oppdatert:** 2024

**Support:**
- Brukerstøtte: [Internt supportnummer]
- Teknisk support: [Power Platform-team]
- Feilrapportering: [Intern feilrapporteringsportal]

**Dokumentasjon:**
- Power Apps: https://docs.microsoft.com/power-apps
- Dataverse: https://docs.microsoft.com/power-apps/maker/data-platform
- SYSVAK: [NHN/FHI dokumentasjon]
- FIKS: [KS FIKS dokumentasjon]

---

**Dokument generert:** 2024-12-12
**Generert av:** Claude Code AI-analyse
**Basert på:** Pasinfo Vaksine V2 kildekodefiler
