import Gtk from "https://gir.deno.dev/Gtk-4.0";
import Adw from "https://gir.deno.dev/Adw-1";
import React from "npm:react";
import { render } from "./render.js";

const app = new Adw.Application();

render(<AppWindow />, app);

const styles = {
  container: {
    padding: 40,
    fontSize: 18,
  },
  label: {
    fontSize: 42,
  },
};

function AppWindow() {
  const [count, setCount] = React.useState(0);

  return (
    <adw-application-window title="Counter">
      <gtk-window-handle>
        <gtk-box orientation={Gtk.Orientation.VERTICAL}>
          <adw-header-bar cssClasses={["flat"]} />
          <gtk-box
            spacing={30}
            vexpand={true}
            valign={Gtk.Align.CENTER}
            halign={Gtk.Align.CENTER}
            style={styles.container}
          >
            <gtk-button label="-" onClicked={() => setCount((c) => c - 1)} />
            <gtk-label label={count.toString()} style={styles.label} />
            <gtk-button label="+" onClicked={() => setCount((c) => c + 1)} />
          </gtk-box>
        </gtk-box>
      </gtk-window-handle>
    </adw-application-window>
  );
}
