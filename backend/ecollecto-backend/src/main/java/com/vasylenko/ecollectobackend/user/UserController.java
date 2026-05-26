package com.vasylenko.ecollectobackend.user;

import com.vasylenko.ecollectobackend.common.security.CurrentUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class UserController {

    private final UserService userService;
    private final CurrentUserService currentUserService;

    public UserController(UserService userService, CurrentUserService currentUserService) {
        this.userService = userService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public UserDto getProfile() {
        String userId = currentUserService.getCurrentUserId();
        return userService.getOrCreateProfile(userId);
    }
}

