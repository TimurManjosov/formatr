# RFC: Class-Based Template Components (Issue #07)

**Status:** Draft  
**Created:** 2025-12-20  
**Author:** TimurManjosov

## Summary

This RFC proposes introducing class-based template components to formatr, allowing developers to create reusable, stateful template components with lifecycle methods and encapsulated logic.

## Motivation

While function-based templates are powerful, complex UI patterns often benefit from:
- **State management**: Components that maintain internal state
- **Lifecycle hooks**: Initialize resources, clean up, respond to updates
- **Inheritance**: Share common behavior across component hierarchies
- **Encapsulation**: Bundle related logic and templates together

Class-based components would complement the existing functional approach, giving developers more architectural options.

## Detailed Design

### Basic Syntax

```python
from formatr import Component

class UserCard(Component):
    """A reusable user card component."""
    
    def __init__(self, user):
        super().__init__()
        self.user = user
        self.is_expanded = False
    
    def template(self):
        return f"""
        <div class="user-card">
            <h3>{self.user.name}</h3>
            <p>{self.user.email}</p>
            {self.render_details() if self.is_expanded else ''}
            <button onclick="{self.toggle_expand}">
                {'Collapse' if self.is_expanded else 'Expand'}
            </button>
        </div>
        """
    
    def render_details(self):
        return f"""
        <div class="details">
            <p>Bio: {self.user.bio}</p>
            <p>Joined: {self.user.joined_date}</p>
        </div>
        """
    
    def toggle_expand(self):
        self.is_expanded = not self.is_expanded
        self.update()
```

### Lifecycle Methods

```python
class DataTable(Component):
    """Table component with data fetching."""
    
    def on_mount(self):
        """Called when component is first rendered."""
        self.data = self.fetch_data()
        self.setup_event_listeners()
    
    def on_update(self, prev_props):
        """Called when component props change."""
        if prev_props.query != self.props.query:
            self.data = self.fetch_data()
    
    def on_unmount(self):
        """Called before component is removed."""
        self.cleanup_event_listeners()
        self.close_connections()
    
    def template(self):
        return f"""
        <table>
            {self.render_rows()}
        </table>
        """
```

### Component Composition

```python
class Dashboard(Component):
    """Dashboard composed of multiple components."""
    
    def template(self):
        return f"""
        <div class="dashboard">
            <header>
                {self.render_component(NavBar(user=self.props.user))}
            </header>
            <main>
                {self.render_component(UserCard(user=self.props.user))}
                {self.render_component(DataTable(query=self.props.query))}
            </main>
            <footer>
                {self.render_component(Footer())}
            </footer>
        </div>
        """
```

### State Management

```python
class Counter(Component):
    """Counter with internal state."""
    
    def __init__(self):
        super().__init__()
        self.state = {
            'count': 0,
            'history': []
        }
    
    def increment(self):
        self.set_state({
            'count': self.state['count'] + 1,
            'history': self.state['history'] + [self.state['count'] + 1]
        })
    
    def template(self):
        return f"""
        <div class="counter">
            <h2>Count: {self.state['count']}</h2>
            <button onclick="{self.increment}">Increment</button>
            <div>History: {', '.join(map(str, self.state['history']))}</div>
        </div>
        """
```

### Props and Validation

```python
class Button(Component):
    """Button component with prop validation."""
    
    props_schema = {
        'label': {'type': str, 'required': True},
        'variant': {'type': str, 'default': 'primary', 'choices': ['primary', 'secondary', 'danger']},
        'disabled': {'type': bool, 'default': False},
        'onclick': {'type': callable, 'required': False}
    }
    
    def template(self):
        classes = f"btn btn-{self.props.variant}"
        if self.props.disabled:
            classes += " btn-disabled"
        
        return f"""
        <button class="{classes}" 
                {'disabled' if self.props.disabled else ''}
                onclick="{self.props.onclick or ''}">
            {self.props.label}
        </button>
        """
```

## Implementation Considerations

### Base Component Class

```python
class Component:
    """Base class for all components."""
    
    def __init__(self, **props):
        self.props = self._validate_props(props)
        self.state = {}
        self._mounted = False
    
    def template(self):
        """Override this method to define component template."""
        raise NotImplementedError
    
    def render(self):
        """Render the component to HTML."""
        if not self._mounted:
            self.on_mount()
            self._mounted = True
        return self.template()
    
    def set_state(self, new_state):
        """Update component state and trigger re-render."""
        old_state = self.state.copy()
        self.state.update(new_state)
        self.on_state_change(old_state)
        self.update()
    
    def update(self):
        """Trigger component re-render."""
        # Implementation depends on rendering strategy
        pass
    
    # Lifecycle hooks (can be overridden)
    def on_mount(self):
        pass
    
    def on_update(self, prev_props):
        pass
    
    def on_unmount(self):
        pass
    
    def on_state_change(self, prev_state):
        pass
    
    def render_component(self, component):
        """Render a child component."""
        return component.render()
    
    def _validate_props(self, props):
        """Validate props against schema if defined."""
        if hasattr(self, 'props_schema'):
            # Validation logic
            pass
        return type('Props', (), props)
```

### Integration with formatr

Components should integrate seamlessly with existing formatr features:

```python
from formatr import html, Component

@html
def page(user):
    dashboard = Dashboard(user=user, query="recent")
    return dashboard.render()
```

## Drawbacks

- **Increased complexity**: Adds another programming paradigm to learn
- **Bundle size**: Class infrastructure adds overhead
- **Mental model**: Developers need to understand when to use classes vs functions
- **Server-side focus**: Client-side interactivity requires additional work

## Alternatives

1. **Enhanced function decorators**: Add stateful capabilities to functional templates
2. **Separate component library**: Create formatr-components as a standalone package
3. **Template inheritance only**: Support template extension without full class components

## Open Questions

1. How should client-side interactivity be handled?
2. Should we support async lifecycle methods?
3. How do class components interact with formatr's compilation/optimization?
4. Should there be a way to serialize component state for SSR?
5. How should events and handlers be managed?

## Prior Art

- **React Class Components**: Inspiration for lifecycle methods and state
- **Vue.js Components**: Class-based component API before Composition API
- **Django Class-Based Views**: Python patterns for class-based rendering
- **Lit Element**: Web components with class-based approach

## Future Possibilities

- **Mixins/Composition**: Reusable behavior through composition
- **Hooks for classes**: Port React Hooks concepts to class components
- **Component registry**: Automatic component discovery and registration
- **Hot module reloading**: Development-time component updates
- **TypeScript support**: Type-safe props and state

## References

- [React Class Components Documentation](https://reactjs.org/docs/react-component.html)
- [Vue Class Component](https://class-component.vuejs.org/)
- [Lit Element](https://lit.dev/)
- [Django Class-Based Views](https://docs.djangoproject.com/en/stable/topics/class-based-views/)

---

**Discussion**: Please provide feedback on this RFC in the comments below or via pull request.
