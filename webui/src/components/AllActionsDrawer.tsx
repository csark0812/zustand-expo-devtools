import {
  selectInstance,
  updateMonitorState,
  type CoreStoreState,
} from "@redux-devtools/app-core";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@redux-devtools/ui/src/utils/theme";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPANDED_WIDTH = 200;
const COLLAPSED_WIDTH = 40;
const ANIM_DURATION = 220;

interface DerivedActionEntry {
  id: number;
  type: string;
  timestamp: number;
  storeName: string;
}

export function AllActionsDrawer() {
  const [expanded, setExpanded] = useState(true);
  const animWidth = useRef(new Animated.Value(EXPANDED_WIDTH)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;

  const dispatch = useDispatch<any>();
  const instances = useSelector((s: CoreStoreState) => s.instances);
  const monitorState = useSelector(
    (s: CoreStoreState) => (s as any).monitor?.monitorState,
  );

  const flatListRef = useRef<FlatList>(null);

  // Derive flat list of actions across all store instances from Redux DevTools state
  const derivedActions = useMemo(() => {
    if (!instances?.states) return [];
    const actions: DerivedActionEntry[] = [];

    Object.entries(instances.states).forEach(([storeName, storeState]) => {
      if (storeName === "default") return;
      storeState.stagedActionIds.forEach((actionId) => {
        const entry = storeState.actionsById[actionId];
        if (entry) {
          let type = "";
          if (entry.action) {
            if (typeof entry.action === "string") {
              try {
                type = JSON.parse(entry.action).type;
              } catch {
                type = entry.action;
              }
            } else if (
              typeof entry.action === "object" &&
              "type" in entry.action
            ) {
              type = (entry.action as any).type;
            }
          }
          actions.push({
            id: actionId,
            type: type || "anonymous",
            timestamp: entry.timestamp,
            storeName,
          });
        }
      });
    });

    // Sort descending by timestamp (newest actions first)
    return actions.sort((a, b) => b.timestamp - a.timestamp);
  }, [instances]);

  const totalCount = derivedActions.length;

  const handleSelectAction = useCallback(
    (action: DerivedActionEntry) => {
      const isCurrentlySelected =
        instances?.selected === action.storeName &&
        action.id === monitorState?.selectedActionId;

      if (isCurrentlySelected) {
        // Unselect: reset instance selection to default and clear focused action log
        dispatch(selectInstance("default"));
        dispatch(updateMonitorState({ selectedActionId: null } as any));
      } else {
        // Select: switch to the store and focus the clicked action log
        dispatch(selectInstance(action.storeName));
        dispatch(updateMonitorState({ selectedActionId: action.id } as any));
      }
    },
    [dispatch, instances, monitorState],
  );

  // Read theme settings from Redux DevTools store
  const themeState = useSelector((s: CoreStoreState) => s.theme);
  const resolvedTheme = useTheme({
    theme: themeState.theme,
    scheme: themeState.scheme,
    colorPreference: themeState.colorPreference,
  });

  // colors  from theme
  const colors = useMemo(
    () => ({
      bg: resolvedTheme.base00,
      surface: resolvedTheme.base01,
      border: resolvedTheme.base02,
      muted: resolvedTheme.base03,
      text: resolvedTheme.base06,
      accent: resolvedTheme.base0D,
    }),
    [resolvedTheme],
  );

  const renderActionRow = useCallback(
    ({ item: action }: { item: DerivedActionEntry }) => {
      const activeInstance = instances?.selected || instances?.current;

      // Get the stagedActionIds and currentStateIndex for the active store
      const activeStoreState = instances?.states?.[activeInstance];
      const activeStagedActionIds = activeStoreState?.stagedActionIds;
      const activeCurrentStateIndex = activeStoreState?.currentStateIndex;

      // Determine the currently inspected action ID in Redux DevTools
      const currentInspectedActionId =
        monitorState?.selectedActionId !== null &&
        monitorState?.selectedActionId !== undefined
          ? monitorState.selectedActionId
          : activeStagedActionIds && activeCurrentStateIndex !== undefined
            ? activeStagedActionIds[activeCurrentStateIndex]
            : undefined;

      // Highlight if it is explicitly selected in Redux DevTools
      const isSelected =
        instances?.selected === action.storeName &&
        action.id === currentInspectedActionId;

      return (
        <Pressable
          onPress={() => handleSelectAction(action)}
          style={({ pressed, hovered }: any) => [
            styles.row,
            {
              borderBottomColor: colors.border,
              backgroundColor: isSelected
                ? colors.border
                : pressed || hovered
                  ? colors.surface
                  : "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.storeBadge,
              { fontFamily: resolvedTheme.codeFontFamily },
            ]}
            numberOfLines={1}
          >
            {action.storeName}
          </Text>
          <Text
            style={[
              styles.actionName,
              { fontFamily: resolvedTheme.codeFontFamily },
            ]}
            numberOfLines={1}
          >
            {action.type}
          </Text>
        </Pressable>
      );
    },
    [instances, monitorState, colors, handleSelectAction],
  );

  const toggle = useCallback(() => {
    const toExpand = !expanded;
    setExpanded(toExpand);

    Animated.parallel([
      Animated.timing(animWidth, {
        toValue: toExpand ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        duration: ANIM_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(animOpacity, {
        toValue: toExpand ? 1 : 0,
        duration: toExpand ? ANIM_DURATION : ANIM_DURATION * 0.4,
        useNativeDriver: false,
      }),
    ]).start();
  }, [expanded, animWidth, animOpacity]);

  return (
    <Animated.View style={[styles.wrapper, { width: animWidth }]}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.bg, borderRightColor: colors.border },
        ]}
      >
        {/* ── Header (always visible, acts as toggle) ── */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          {!expanded ? (
            <Pressable
              onPress={toggle}
              style={({ pressed, hovered }: any) => [
                styles.chevron,
                (pressed || hovered) && { backgroundColor: colors.surface },
              ]}
            >
              »
            </Pressable>
          ) : (
            <>
              <Animated.View
                style={[styles.headerRight, { opacity: animOpacity }]}
              >
                <Text
                  style={[
                    styles.headerTitle,
                    {
                      color: colors.text,
                      fontFamily: resolvedTheme.fontFamily,
                    },
                  ]}
                >
                  All Actions
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      {
                        color: colors.accent,
                        fontFamily: resolvedTheme.fontFamily,
                      },
                    ]}
                  >
                    {totalCount}
                  </Text>
                </View>
              </Animated.View>

              {/* Chevron icon */}
              <Pressable
                onPress={toggle}
                style={({ pressed, hovered }: any) => [
                  styles.chevron,
                  (pressed || hovered) && { backgroundColor: colors.surface },
                ]}
              >
                «
              </Pressable>
            </>
          )}
        </View>

        {/* ── Content — only rendered when expanded ── */}
        {derivedActions.length === 0 ? (
          <Animated.View style={[styles.empty, { opacity: animOpacity }]}>
            <Text style={styles.emptyIcon}>⚡</Text>
            <Text
              style={[
                styles.emptyTitle,
                { color: colors.muted, fontFamily: resolvedTheme.fontFamily },
              ]}
            >
              No actions
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.listWrapper, { opacity: animOpacity }]}>
            <FlatList
              ref={flatListRef}
              data={derivedActions}
              keyExtractor={(item) => `${item.storeName}-${item.id}`}
              renderItem={renderActionRow}
              showsVerticalScrollIndicator={true}
              scrollEnabled={expanded}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 0,
              }}
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Static styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    // width is driven by Animated.Value
    overflow: "hidden",
    // @ts-ignore — web-only property, not in RN types but works on Expo Web
    userSelect: "none",
  },
  container: {
    flex: 1,
    borderRightWidth: 1,
    width: EXPANDED_WIDTH, // inner width always full; outer wrapper clips it
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chevron: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 20,
    width: 40,
    textAlign: "center",
    padding: 10,
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    padding: 10,
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 10,
    fontWeight: 700,
  },
  listWrapper: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "flex-end",
  },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  toolbarButtonIcon: {
    fontSize: 14,
    fontWeight: 700,
  },
  toolbarButtonText: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  list: {
    flex: 1,
  },
  row: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  storeBadge: {
    fontSize: 12,
    lineHeight: 20,
    overflow: "hidden",
  },
  actionName: {
    fontSize: 9,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
  },
});
