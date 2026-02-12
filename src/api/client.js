import { authService } from './services/auth';
import { postsService } from './services/posts';
import { usersService } from './services/users';
import { exploreService } from './services/explore';
import { notificationsService } from './services/notifications';
import { mediaService } from './services/media';

 
export const apiClient = {
    ...authService,
    ...postsService,
    ...usersService,
    ...exploreService,
    ...notificationsService,
    ...mediaService
};