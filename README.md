# Directus Advanced Kanban Layout

A powerful Kanban layout extension for Directus that goes beyond the native capabilities. Designed for complex workflows that require detailed card visibility, flexible sorting, and responsive layout styling.

## Key Features

- **Dynamic Template Rendering**: Use Directus field templates (e.g., `{{ title }} - {{ status }}`) for both card titles and text areas. No more being restricted to a single field.
- **Relational Grouping**: Group items by many-to-one (M2O) and one-to-many (O2M) relationships with support for custom header templates.

- **Custom Card Sorting**: Sort cards within columns by any field in your collection (Date, Priority, etc.) with support for ascending or descending order.
- **Custom Styling**: Customize the width of columns and the height of cards.


## Installation

To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).

## Configuration

Once installed, select **Kanban (Advanced)** from the layout options in any collection.

### Layout Options:
- **Group By**: Select the field to use for columns (supports dropdowns and M2O relations).
- **Group Header Template**: (For relational groups) Enter a template for column headers.
- **Title Template**: Enter a template for the card title (e.g., `{{ id }} | {{ name }}`).
- **Text Template**: Enter a template for the card body/description.
- **Date Field**: Add a visual date indicator to the footer of the card.
- **User Card**: Display user avatars on cards based on an assigned user relationship.

### Advanced Settings:
- **Show Ungrouped**: Toggle whether to show a column for items that don't belong to any group.
- **Sort Items By**: Choose a field to control the order of cards within each column.
- **Sort Direction**: Select between Ascending and Descending order.
- **Card Max Height and Column Width**: Set the maximum height for cards and width for columns in pixels.
- **Items Limit**: Set the maximum number of items to fetch. Default is 1000, but you can increase it as needed.

### Future Enhancements:
- [ ] Add support for translations.

## License

MIT


