class AppState {
  setAgents(agents) {
    this.agents = agents;
    this.selectedAgent = null;
    this.selectedAgentApiKey = null;
  }

  getAgents() {
    return this.agents;
  }

  selectAgent(agentId) {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found.`);
    this.selectedAgent = agent;
    this.selectedAgentApiKey = agent.apiKey;
  }

  setSelectedAgentApiKey(apiKey) {
    if (!this.selectedAgent) throw new Error("No agent selected.");
    this.selectedAgentApiKey = apiKey;
    this.selectedAgent.apiKey = apiKey;
  }

  getSelectedAgentApiKey() {
    return this.selectedAgentApiKey;
  }

  getSelectedAgent() {
    return this.selectedAgent;
  }

  hasSelectedAgent() {
    return this.selectedAgent !== null;
  }

  clearSelectedAgent() {
    this.selectedAgent = null;
    this.selectedAgentApiKey = null;
  }
}

export {AppState}
