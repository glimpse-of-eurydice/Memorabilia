# Thought Space

## Primitive Seeds, Experience Traces, and the Development of Cognitive Organization

> **Working status:** exploratory research plan / design document\
> **Core intuition:** Memory may be better understood not as stored
> records, but as persistent changes in how a cognitive system attends
> to, relates, organizes, and later acts upon experience.

------------------------------------------------------------------------

## 0. One-sentence idea

**Thought Space asks whether a small set of primitive cognitive priors,
interacting with a continuous stream of experience, can grow into
increasingly complex and behaviorally consequential ways of organizing
information.**

The eventual engineering artifact may look like a memory architecture,
but the research object is broader: **development**.

A provisional framing is:

> **How do primitive seeds shape the development of an artificial
> cognitive system, particularly the ways in which it selects,
> consolidates, relates, and reorganizes information over time?**

The project therefore moves away from:

> What should an agent store and retrieve?

toward:

> **How does experience become structure, and how does that structure
> change future cognition?**

------------------------------------------------------------------------

# 1. Motivation: from memory storage to cognitive development

Most agent-memory architectures make memory legible as an engineering
object: episodic stores, semantic stores, vector databases, summaries,
retrieval policies, forgetting policies, and so on.

Thought Space begins from a different intuition.

A remembered experience is interesting not merely because a record of it
survives. It is interesting because it can alter:

-   what the system notices next;
-   what it expects;
-   what it considers surprising;
-   which previous experiences become relevant;
-   how concepts become connected;
-   which structures become stable;
-   and eventually, perhaps, what the system appears to care about.

This suggests a stronger operational definition:

> **An experience has entered the cognitive system when it produces a
> persistent, testable change in the system's future cognitive
> dynamics.**

The visible "memory" is then a trace of development rather than the
whole of memory itself.

A useful conceptual loop is:

``` text
primitive seed
    ↓
context / current state
    ↓
encounter
    ↓
attention + expectation + relevance
    ↓
local structural change
    ↓
consolidation / decay / reactivation
    ↓
emergent organization
    ↓
changed future attention / expectation / retrieval
    ↺
```

Identity, goals, preferences, and values should not necessarily sit
entirely outside this loop. Some may be initial conditions; some may
themselves become developmental products.

------------------------------------------------------------------------

# 2. Intellectual and empirical inspirations

The project should borrow **constraints and hypotheses**, not claim that
an AI graph literally implements a human brain. Neuroscience is useful
here as a source of computational principles: allocation, reactivation,
overlap, consolidation, separation, completion, and schema formation.

## 2.1 Engrams: memory as a physical and reactivatable trace

### Josselyn, Köhler & Frankland (2015)

**Finding the engram.** *Nature Reviews Neuroscience, 16*, 521--534.\
DOI: 10.1038/nrn4000

Why it matters:

-   Gives a rigorous modern account of what it would mean to identify a
    memory engram.
-   Distinguishes observing, erasing/silencing, and artificially
    expressing a memory trace.
-   Particularly important for Thought Space because it suggests that
    **visualizing a trace is insufficient**: causal manipulation is
    stronger evidence that the trace participates in memory.

Design translation:

``` text
observe bubble
      ≠
prove bubble matters

observe
   ↓
intervene
   ↓
test future behavior
```

This motivates the third experimental requirement: a visible
organization should eventually be probed or manipulated.

### Josselyn & Tonegawa (2020)

**Memory engrams: Recalling the past and imagining the future.**
*Science, 367*(6473), eaaw4325.\
DOI: 10.1126/science.aaw4325

Why it matters:

-   Treats engrams as ensembles involved in encoding and later
    retrieval.
-   Useful against an overly literal "one memory = one node" model.
-   Encourages thinking in terms of **distributed, overlapping,
    reactivatable structures**.

Thought Space implication:

A bubble should not necessarily correspond to a single stored item. It
could represent an observable projection of a distributed state: an
encounter, concept, cluster, or temporarily stabilized attractor.

------------------------------------------------------------------------

## 2.2 Complementary Learning Systems: episodes and slowly emerging structure

### McClelland, McNaughton & O'Reilly (1995)

**Why there are complementary learning systems in the hippocampus and
neocortex: Insights from the successes and failures of connectionist
models of learning and memory.** *Psychological Review, 102*(3),
419--457.\
DOI: 10.1037/0033-295X.102.3.419

Why it matters:

The classic Complementary Learning Systems (CLS) account proposes a
productive tension between:

-   rapid learning of particular experiences; and
-   slower extraction of shared structure across experiences.

This is almost directly translatable into Thought Space:

``` text
encounter traces
      ↓
many partially related experiences
      ↓
repeated activation / consolidation
      ↓
stable organization
```

The project can therefore explicitly distinguish:

**fast trace formation** from **slow structural development**.

This may become an architectural primitive rather than a hand-coded
taxonomy of concepts.

------------------------------------------------------------------------

## 2.3 Schema formation: new experience depends on what already exists

### Tse et al. (2007)

**Schemas and memory consolidation.** *Science, 316*(5821), 76--82.\
DOI: 10.1126/science.1135935

Why it matters:

The paper provides evidence that once an associative schema exists,
related new information can be incorporated rapidly.

This matters enormously for the project's "chicken-and-egg" problem:

> Surprise is not an intrinsic property of an encounter.\
> The significance of an encounter depends partly on the structure that
> already exists.

The same information may therefore produce very different structural
effects at developmental time (t_1) and (t_2).

This suggests that **developmental history must be part of the
experimental variable**.

------------------------------------------------------------------------

## 2.4 Piaget: assimilation, accommodation, and equilibration

Relevant primary sources to enter through:

### Jean Piaget (1975/1985 English translation)

**The Equilibration of Cognitive Structures: The Central Problem of
Intellectual Development.**

### Jean Piaget (1952)

**The Origins of Intelligence in Children.**

Concepts that matter here:

-   **Assimilation:** an encounter is interpreted through an existing
    scheme.
-   **Accommodation:** existing schemes change in response to encounters
    that cannot be adequately assimilated.
-   **Equilibration:** development involves regulation between these
    processes rather than unlimited accumulation.

Thought Space translation:

``` text
Encounter E
   │
   ├── fits existing organization
   │       → assimilation
   │       → strengthen / elaborate existing structure
   │
   └── produces consequential mismatch
           → accommodation
           → reorganize existing structure
```

This is more useful than defining "surprise" as raw novelty.

A possible operational distinction becomes:

> **Surprise is an event-level signal; accommodation is a system-level
> consequence.**

The latter may be easier and more meaningful to observe.

------------------------------------------------------------------------

## 2.5 Predictive processing / active inference: expectation and consequential mismatch

### Friston (2010)

**The free-energy principle: a unified brain theory?** *Nature Reviews
Neuroscience, 11*, 127--138.\
DOI: 10.1038/nrn2787

This should be treated carefully: Thought Space does **not** need to
adopt the Free Energy Principle wholesale.

Useful inspiration:

-   surprise is relative to an internal generative model;
-   perception and learning depend on prior expectations;
-   prediction errors differ in effective importance;
-   attention/salience can affect which errors matter.

This provides a way out of:

> "How surprising must something be to deserve memory?"

A more useful question may be:

> **Under the current model, context, and precision/relevance structure,
> which mismatches are allowed to reorganize the system?**

------------------------------------------------------------------------

## 2.6 Intrinsic motivation and developmental robotics

### Oudeyer & Kaplan (2007)

**What is intrinsic motivation? A typology of computational
approaches.** *Frontiers in Neurorobotics, 1*, 6.\
DOI: 10.3389/neuro.12.006.2007

### Oudeyer, Kaplan & Hafner (2007)

**Intrinsic Motivation Systems for Autonomous Mental Development.**
*IEEE Transactions on Evolutionary Computation, 11*(2), 265--286.\
DOI: 10.1109/TEVC.2006.890271

Why they matter:

These works connect curiosity, spontaneous exploration, learning
progress, and open-ended development with computational agents.

Thought Space differs from a standard intrinsic-reward project because
its primary outcome is not task reward. The central dependent variable
is:

> **the organization that develops through exploration.**

Still, developmental robotics offers useful precedent for asking how
relatively small motivational priors can produce increasingly complex
behavior without pre-specifying every developmental outcome.

------------------------------------------------------------------------

# 3. Central research object

The research object is **not the bubble visualization itself**.

The actual object is a developmental process with three increasingly
strong levels of observability.

## Layer 1 --- Experience / Encounter Trace

Question:

> **What happened to the system?**

For every encounter, record as much of the following as experimentally
feasible:

``` yaml
encounter_id:
timestamp:
input:
context:
current_goal:
current_task:
active_prior_structure:
prediction_or_expectation:
attention:
novelty_signal:
relevance_signal:
retrieved_prior_traces:
response:
immediate_update:
```

Not all fields need to exist in MVP v0.

The important principle is that the project retains an **event history**
rather than only the final memory state.

Possible encounter types:

-   reading a paragraph;
-   encountering a paper;
-   conversation;
-   task attempt;
-   feedback;
-   contradiction;
-   repeated observation;
-   failed prediction;
-   explicit correction;
-   self-generated inference.

This layer gives us the developmental history.

------------------------------------------------------------------------

# 4. Layer 2 --- Thought Space: bubbles and webs

Question:

> **What has grown?**

This is the visual layer the user initially imagined.

An encounter may first appear as a transient bubble.

``` text
○ faint encounter
        ↓ repeated / consequential activation
◉ stabilized representation
        ↓ relational development
◉────◉
   ↓
web / cluster / motif
```

Possible observable properties:

-   bubble birth;
-   activation strength;
-   persistence;
-   decay;
-   reactivation;
-   merging;
-   splitting;
-   cluster formation;
-   edge birth/death;
-   edge strengthening;
-   path activation;
-   centrality;
-   structural reorganization.

Crucially, **the graph should be temporal**.

Thought Space should allow replay:

``` text
t0 → t1 → t2 → t3 → ...
```

so the researcher can watch a structure develop rather than merely
inspect its final snapshot.

### Important epistemic constraint

A bubble is an **instrumented representation**, not a claim that the
model literally contains a corresponding discrete concept object
internally.

The visualization is a research interface over observable system state.

------------------------------------------------------------------------

# 5. Layer 3 --- Emergent organization

Question:

> **How has the system learned to organize what it encounters?**

This is the most important and least settled layer.

The project should initially avoid hard-coding a taxonomy such as:

-   similarity;
-   contrast;
-   hierarchy;
-   analogy;
-   causality;
-   narrative;
-   temporal organization.

These are better treated first as **candidate emergent organizational
motifs**.

The central experiment becomes:

> Given minimal primitive seeds, do recurring higher-order ways of
> organizing information emerge?

Potential motifs to detect:

``` text
categorization
hierarchy
analogy
contrast
causal schema
temporal narrative
part–whole structure
contextual clusters
cross-domain mapping
prototype / exemplar structure
```

But detecting a motif visually is not enough.

### Organization Probe

If the graph suggests organization (O), test whether (O) predicts future
cognition.

Examples:

**Retrieval probe**

If A and B have developed a strong relation:

``` text
present A
→ does B become more likely to be retrieved?
```

**Generalization probe**

If the system has repeatedly learned:

``` text
A : B
C : D
```

present a new structurally similar case:

``` text
E : ?
```

and test whether the inferred organization transfers.

**Intervention probe**

Remove or weaken an edge / bubble / motif and test whether:

-   retrieval changes;
-   interpretation changes;
-   reasoning changes;
-   future learning changes.

Thus:

``` text
Trace
  ↓
Visible Space
  ↓
Detected Organization
  ↓
Behavioral Probe
  ↓
Intervention
```

This is much stronger than "pretty graph = cognition."

------------------------------------------------------------------------

# 6. Primitive seeds: the central design problem

The most interesting architectural question may be:

> **What is the smallest set of primitives from which a system capable
> of meaningful cognitive development can grow?**

The guiding aesthetic is:

# Less is more.

Do **not** begin by giving the agent:

``` text
similarity
contrast
hierarchy
analogy
causality
narrative
identity
values
...
```

If these are all pre-built, the experiment cannot tell us whether
organization developed or was simply specified by the designer.

Instead, candidate primitive families might include:

### A. Attention / selection

The system cannot process everything equally.

``` text
attention(x | context)
```

### B. Expectation

The current organization produces some expectation about what comes next
or what an encounter means.

``` text
expected(x | current_state)
```

### C. Mismatch / novelty

An encounter can deviate from expectation.

But **raw surprise should not automatically equal memory importance**.

### D. Association / co-activation

Repeated or contextually linked activation can make future joint
activation more likely.

### E. Persistence / decay

Structural changes can survive, strengthen, weaken, or disappear.

### F. Context

Probably indispensable.

Context may include:

-   current task;
-   current goal;
-   active identity/self-model;
-   environmental state;
-   conversational partner;
-   developmental history.

The same encounter under different contexts should be allowed to produce
different effects.

### G. Action / feedback

The system acts, receives consequences, and therefore generates new
experience.

This prevents development from being purely passive ingestion.

------------------------------------------------------------------------

# 7. The unresolved status of goal, identity, value, and "care"

This should remain an **open theoretical issue**, not be prematurely
solved in the architecture.

There are at least three possibilities.

### Model A --- fixed priors

Goal / identity / values are initial conditions that modulate attention
and learning.

### Model B --- developmental variables

The system starts with extremely weak versions, which themselves change
through experience.

### Model C --- two-level model

Some minimal "care" or viability constraints are architectural
primitives, while concrete goals, preferences, and identity emerge
developmentally.

For example:

``` text
minimal relevance / care prior
          ↓
selective encounters
          ↓
stable preferences
          ↓
goal formation
          ↓
self-model / identity
```

At present, **Model C seems especially interesting**, but this is a
hypothesis, not a commitment.

------------------------------------------------------------------------

# 8. Why "surprise" is insufficient

A central conceptual problem is:

> Why does one surprising idea transform someone's thinking while
> another surprising fact disappears ten minutes later?

Raw novelty cannot explain this.

A provisional model could distinguish:

``` text
novelty
    ×
contextual relevance
    ×
compatibility / conflict with prior structure
    ×
goal relevance
    ×
repetition
    ×
attention
```

But this should **not** immediately become one arbitrary weighted score.

Instead, Thought Space can make this experimentally testable.

Example:

Give the same surprising encounter under:

1.  goal-relevant context;
2.  goal-irrelevant context;
3.  compatible prior schema;
4.  strongly conflicting prior schema;
5.  repeated exposure;
6.  one-shot exposure.

Observe whether it produces:

-   no persistent trace;
-   local strengthening;
-   assimilation;
-   accommodation;
-   large-scale reorganization.

This turns the philosophical question into an ablation space.

------------------------------------------------------------------------

# 9. Experimental design

There are two major axes of ablation.

## 9.1 Primitive ablation

Hold experience constant; vary the initial cognitive seed.

Example:

  -----------------------------------------------------------------------------------
  Agent      Attention   Expectation   Association   Context    Decay      Goal prior
  ---------- ----------- ------------- ------------- ---------- ---------- ----------
  A          ✓                         ✓             ✓          ✓

  B          ✓           ✓             ✓             ✓          ✓

  C          ✓           ✓             ✓             ✓          ✓          ✓

  D          ✓           ✓                           ✓          ✓          ✓
  -----------------------------------------------------------------------------------

Question:

> Do different primitive seeds produce systematically different
> developmental trajectories and organizational motifs under the same
> experience stream?

This may become the project's cleanest central experiment.

------------------------------------------------------------------------

## 9.2 Experience ablation

Hold primitives constant; vary developmental history.

Possible manipulations:

### Order

``` text
A → B → C
versus
C → B → A
```

Does developmental order alter final topology?

### Repetition

One-shot vs repeated exposure.

### Contradiction

Introduce an encounter that conflicts with a stable organization.

### Goal relevance

Same information, different active task.

### Social feedback

Same encounter with/without correction or endorsement.

### Developmental timing

Introduce the same concept early vs after a schema has stabilized.

This directly tests whether the system is path-dependent.

------------------------------------------------------------------------

# 10. Candidate Research Questions

These should be refined after a literature review and small technical
prototype.

## RQ1 --- Primitive seed → developmental trajectory

> **How do different primitive cognitive seeds influence the development
> of information organization in an artificial agent exposed to the same
> sequence of experiences?**

This is currently the strongest candidate for the **main research
question**.

It is specific enough to experiment on without claiming to reproduce
human cognition.

------------------------------------------------------------------------

## RQ2 --- Experience → persistent structure

> **Under what conditions does an encounter produce a persistent
> structural change rather than a transient trace?**

Variables may include:

-   novelty;
-   repetition;
-   prior compatibility;
-   contextual relevance;
-   active goal;
-   developmental timing.

This operationalizes "when does experience become memory?"

------------------------------------------------------------------------

## RQ3 --- Emergent organization

> **Can higher-order organizational motifs emerge from a minimal set of
> lower-level primitives without being explicitly specified in
> advance?**

Candidate motifs:

-   categories;
-   analogies;
-   hierarchies;
-   causal structures;
-   temporal schemas.

This is conceptually exciting but requires careful operational
definitions.

------------------------------------------------------------------------

## RQ4 --- Organization → future cognition

> **Do emergent organizational structures produce stable and causally
> testable biases in subsequent retrieval, interpretation,
> generalization, and reasoning?**

This is essential if the project wants to claim more than visualization.

------------------------------------------------------------------------

## RQ5 --- Developmental path dependence

> **To what extent does the order and context of experience alter the
> organizational structures that emerge from an otherwise identical
> primitive seed?**

This could become a particularly elegant experiment:

``` text
same seed
+
same experiences
+
different order
=
different Thought Space?
```

------------------------------------------------------------------------

## RQ6 --- Seed vs experience

A broader factorial question:

> **How much of an agent's eventual cognitive organization is
> attributable to its primitive seed, and how much to the structure and
> ordering of its experience?**

This directly captures the "chicken or egg" intuition.

A simple conceptual experiment:

``` text
                Experience 1     Experience 2
Seed A               A1               A2
Seed B               B1               B2
```

Compare:

-   within-seed divergence;
-   between-seed divergence;
-   seed × experience interaction.

------------------------------------------------------------------------

# 11. What about values, taste, and identity?

This is probably **not the first dependent variable**.

"Value" and especially "aesthetic taste" are difficult because a model
can verbally state a preference without possessing a stable organization
that meaningfully constrains future behavior.

For the first version, use more operationally observable constructs:

``` text
attention allocation
retrieval preference
association strength
generalization tendency
interpretive framing
exploration choice
resistance to contradictory evidence
```

Later, values/taste can be treated as a possible **higher-order
developmental phenomenon**.

A future hypothesis might be:

> A value is not merely a stored proposition ("I value X"), but a stable
> organizational bias that repeatedly affects attention, interpretation,
> retrieval, and action across contexts.

Similarly:

> Taste may be operationalized as a persistent, generalizing pattern of
> selective attention and preference that cannot be reduced to an
> explicit preference statement.

This is much harder --- but it gives the project a long-term
philosophical direction without making v0 impossible.

------------------------------------------------------------------------

# 12. Recommended scope for v0

Do not build a child.

Do not build a full cognitive architecture.

Do not solve identity.

Do not solve values.

Do not reproduce the brain.

Build the smallest environment in which **development can become
observable**.

### v0

``` text
one base model
+
one continuous research environment
+
a small primitive layer
+
instrumented encounter traces
+
temporal Thought Space
+
a small battery of organization probes
```

Possible task:

> The agent continuously investigates one interdisciplinary question
> using papers, short essays, conversations, and feedback.

For example:

> **How should artificial memory differ from human memory?**

This naturally exposes it to neuroscience, philosophy, AI memory
systems, contradictory theories, analogies, and repeated concepts.

------------------------------------------------------------------------

# 13. Minimal prototype architecture

``` text
┌───────────────────────────────┐
│          Environment          │
│ paper / dialogue / task / etc │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│       Encounter Tracer        │
│ input / context / response    │
│ attention / expectation ...   │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│       Primitive Layer         │
│ attention                     │
│ expectation                   │
│ association                   │
│ persistence / decay           │
│ context                       │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│       Development Layer       │
│ traces → consolidation        │
│ activation → reactivation     │
│ relation formation/change     │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│         Thought Space         │
│ bubbles / edges / clusters    │
│ temporal replay               │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│      Organization Probe       │
│ retrieval / transfer          │
│ generalization / intervention │
└───────────────────────────────┘
```

------------------------------------------------------------------------

# 14. Measurement ideas

The project will need metrics at several levels.

## Trace-level

-   trace persistence;
-   reactivation frequency;
-   time to decay;
-   encounter → update probability.

## Graph-level

-   node/edge birth and death;
-   cluster stability;
-   graph edit distance over time;
-   modularity;
-   centrality changes;
-   edge persistence;
-   topology divergence between agents.

## Organization-level

Task-specific probes for:

-   categorization;
-   analogy;
-   causal inference;
-   temporal organization;
-   hierarchy/generalization.

## Development-level

Potential summary quantities:

``` text
structural stability
plasticity
path dependence
generalization
differentiation
integration
```

An especially interesting tension:

> **How can a system remain plastic enough to accommodate new experience
> without reorganizing chaotically after every encounter?**

That may eventually become a core notion of developmental stability.

------------------------------------------------------------------------

# 15. Claims to avoid

Thought Space should **not** initially claim:

-   that bubbles are biological engrams;
-   that graph edges are synapses;
-   that an LLM's true internal conceptual structure has been recovered;
-   that Piaget's developmental theory is directly implemented;
-   that surprise is a single scalar biological mechanism;
-   that human cognition has a known finite taxonomy of organizational
    operations;
-   that observed graph organization necessarily causes reasoning
    behavior.

Instead:

> Neuroscience and developmental psychology provide **design
> inspirations and constraints**.\
> Thought Space builds an artificial, instrumentable system in which
> analogous computational questions can be experimentally manipulated.

------------------------------------------------------------------------

# 16. Provisional contribution

If the project works, its contribution may eventually have three levels.

### Engineering contribution

A developmental memory architecture with temporal visualization and
trace-level observability.

### Empirical contribution

Evidence about how primitive priors and developmental histories affect
the organization that emerges in an agent.

### Conceptual contribution

A shift from:

> memory as stored information

toward:

> **memory as persistent modification of future cognitive dynamics.**

And from:

> agent memory management

toward:

> **artificial cognitive development.**

------------------------------------------------------------------------

# 17. The question underneath the project

The engineering version is:

> How should an agent organize memory?

The research version is:

> **How do primitive seeds influence the development of cognitive
> organization through experience?**

The developmental version is:

> **What is the minimum architecture from which a system capable of
> continuing cognitive development can grow?**

And the much longer-term philosophical question is:

> **How does a cognitive system become a particular kind of system
> through what it encounters?**

Thought Space is intended to make part of that process observable.

------------------------------------------------------------------------

# 18. Immediate next steps

1.  **Literature map rather than literature explosion.**\
    Build five small clusters: engrams; CLS/schema; Piaget/development;
    predictive processing; developmental robotics/intrinsic motivation.

2.  **Define "primitive" formally.**\
    A primitive should be something the architecture receives before
    experience and which constrains how experience can modify future
    state.

3.  **Separate primitives from developmental products.**\
    In particular, do not casually classify goal, identity, value,
    analogy, hierarchy, or category as primitives.

4.  **Choose one controlled experience environment.**

5.  **Define one organization motif well enough to probe.**\
    Analogy or categorization may be easier first targets than "values."

6.  **Implement temporal trace → bubble visualization.**

7.  **Run a tiny 2 × 2 experiment before expanding architecture.**

``` text
Seed A / Seed B
       ×
Experience Order 1 / Order 2
```

8.  **Ask whether the final organizational differences predict
    behavior.**

Only after this should the project expand toward open-ended exploration,
identity, or value formation.

------------------------------------------------------------------------

# 19. Current working hypothesis

> **Complex cognitive organization need not be explicitly pre-specified.
> A small set of primitive constraints on attention, expectation,
> association, persistence, context, and interaction may be sufficient
> for higher-order organizational motifs to emerge through developmental
> experience. The form of this organization should depend jointly on the
> primitive seed and the agent's developmental history, and meaningful
> organization should be observable not only as a graph but through
> persistent effects on future cognition.**

This hypothesis is intentionally stronger than a memory-management claim
but weaker than a claim about human cognition.

That is probably the right place for Thought Space to begin.
