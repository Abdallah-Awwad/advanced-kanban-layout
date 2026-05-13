# Directus Advanced Kanban Layout

A powerful Kanban layout extension for Directus that goes beyond the native capabilities. Designed for complex workflows that require detailed card visibility and flexible sorting.

## 🚀 Key Features

- **Dynamic Template Rendering**: Use Directus field templates (e.g., `{{ title }} - {{ status }}`) for both card titles and text areas. No more being restricted to a single field.
- **Custom Card Sorting**: Sort cards within columns by any field in your collection (Date, Priority, etc.) with support for ascending or descending order.
- **Flexible Card Heights**: Configure the maximum height of cards to show more data. Supports `pre-wrap` behavior for manual line breaks.
- **Relational Grouping**: Group items by many-to-one (M2O) and one-to-many (O2M) relationships with support for custom header templates.
- **User Integration**: Automatically displays user avatars for assigned fields with quick navigation to user profiles.

## 🛠 Installation

To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).


## ⚙️ Configuration

Once installed, select **Kanban (Advanced)** from the layout options in any collection.

### Layout Options:
- **Group By**: Select the field to use for columns (supports dropdowns and M2O relations).
- **Title Template**: Enter a template string for the card title (e.g., `{{ id }} | {{ name }}`).
- **Text Template**: Enter a template string for the card body/description.
- **Card Max Height**: Set the maximum height in pixels before the card truncates.
- **Sort Items By**: Choose a field to control the order of cards within each column.

## 📄 License

MIT
