export function buscaEstadoDaRota(state, path) {
  if (!state) return false;

  // Itera sobre os caminhos permitidos
  return allowedPaths.some(path => {
    const pathSegments = path.split('/');
    let currentState = state;

    for (const segment of pathSegments) {
      const foundRoute = currentState.routes.find(route => route.name === segment);
      if (!foundRoute) {
        return false;
      }
      currentState = foundRoute.state;
    }

    return true;
  });
  }
  