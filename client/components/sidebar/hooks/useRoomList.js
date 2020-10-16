import { useMemo } from 'react';

import { useQueuedInquiries, useOmnichannelEnabled } from '../../../contexts/OmnichannelContext';
import { useUserPreference, useUserSubscriptions } from '../../../contexts/UserContext';
import { useQueryOptions } from './useQueryOptions';


const query = { open: { $ne: false } };

export const useRoomList = () => {
	const showOmnichannel = useOmnichannelEnabled();
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const showDiscussion = useUserPreference('sidebarShowDiscussion');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const options = useQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	return useMemo(() => {
		const favorite = new Set();
		const omnichannel = new Set();
		const unread = new Set();
		const _private = new Set();
		const _public = new Set();
		const direct = new Set();
		const discussion = new Set();
		const conversation = new Set();

		rooms.forEach((room) => {
			if (sidebarShowUnread && (room.alert || room.unread) && !room.hideUnreadStatus) {
				return unread.add(room);
			}

			if (favoritesEnabled && room.f) {
				return favorite.add(room);
			}

			if (showDiscussion && room.prid) {
				return discussion.add(room);
			}

			if (room.t === 'c') {
				_public.add(room);
			}

			if (room.t === 'p') {
				_private.add(room);
			}

			if (room.t === 'l') {
				return showOmnichannel && omnichannel.add(room);
			}

			if (room.t === 'd') {
				direct.add(room);
			}

			conversation.add(room);
		});

		const groups = new Map();
		showOmnichannel && inquiries.enabled && groups.set('Omnichannel', []);
		showOmnichannel && !inquiries.enabled && groups.set('Omnichannel', omnichannel);
		showOmnichannel && inquiries.enabled && inquiries.queue.length && groups.set('Incoming_Livechats', inquiries.queue);
		showOmnichannel && inquiries.enabled && omnichannel.size && groups.set('Open_Livechats', omnichannel);
		sidebarShowUnread && unread.size && groups.set('Unread', unread);
		favoritesEnabled && favorite.size && groups.set('Favorites', favorite);
		showDiscussion && discussion.size && groups.set('Discussions', discussion);
		sidebarGroupByType && _private.size && groups.set('Private', _private);
		sidebarGroupByType && _public.size && groups.set('Public', _public);
		sidebarGroupByType && direct.size && groups.set('Direct', direct);
		!sidebarGroupByType && groups.set('Conversations', conversation);
		return [...groups.entries()].flatMap(([key, group]) => [key, ...group]);
	}, [rooms, showOmnichannel, inquiries.enabled, inquiries.queue, favoritesEnabled, sidebarShowUnread, showDiscussion, sidebarGroupByType]);
};