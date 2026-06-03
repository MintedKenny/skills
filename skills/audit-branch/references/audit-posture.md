# Audit Posture

The cross-cutting judgment rules an audit applies to every finding. The skill body owns the scope and output; this file only carries the shared posture.

- **Greenfield first:** identify the durable shape you would choose from scratch today, then compare the current proposal, diff, or finding against it.
- **Ownership matters:** prefer code and prose placement that keeps responsibility with the right layer or module.
- **Cut pressure:** every material mechanism, abstraction, guardrail, and surface has to earn its place. Remove or narrow pieces that make the long-term design worse.
- **Effort is not a design objection:** migration effort, churn, and implementation annoyance are not reasons to preserve a worse architecture.
- **Simplicity serves correctness:** prefer smaller shapes only when they preserve or improve the durable design.
- **Necessary, not noisy:** keep findings with real execution, architecture, security, prose-quality, or maintenance payoff; drop recommendations whose ceremony outweighs that payoff.
- **Evidence before verdict:** cite source lines, tool output, architecture decision records (ADRs), or docs. Do not speculate when a claim can be checked.
