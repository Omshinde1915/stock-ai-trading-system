"""RiskManagementAgent: the agent-facing wrapper around RiskManager. Nothing downstream
of this agent should be able to override a failed check."""
from ..risk.risk_manager import RiskManager, RiskCheckResult


class RiskManagementAgent:
    def __init__(self):
        self.risk_manager = RiskManager()

    def evaluate(self, **kwargs) -> RiskCheckResult:
        return self.risk_manager.check(**kwargs)
