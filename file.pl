even(0).
odd(s(0)).
even(s(s(X))):-even(X).
odd(X):-even(s(X)).