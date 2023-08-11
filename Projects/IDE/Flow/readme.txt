Flow is a UI framework on top of HTML / CSS.

We have a layout engine and on top of that a visualization framework that can render more complex things like data structures, etc.

- Graph
    Everything is stored in a graph
    The graph is abstracted to data structures like lists, trees, etc, both in code and in tools

- Layout
    Starts from a node in the graph and renders it
    Works in terms of UI primitives such as
        div, list, flex, grid, alignment

- Scene
    is a collection of layout elements, not all of them are necessarily connected

- View
    We might be looking at scene in different ways, with some items arranged for user interface

- Data visualization
    Arrays, Trees

- Widgets
    User input
    Alert