from pipeline.select_replay import score_windows

def test_replay_lexicographic_selection_is_not_hand_picked():
    dates=[f'2025-05-{i:02}' for i in range(1,11)]
    u=[33,33,33,33,33,30,30,50,50,50];w=[28]*10
    out=score_windows(dates,u,w)
    assert out[0]['start']=='2025-05-01'
    assert out[0]['consecutive_base_ge_2']==5

def test_earliest_tie_and_incomplete_window():
    dates=[f'2025-05-{i:02}' for i in range(1,8)]
    assert score_windows(dates,[33]*7,[28]*7)[0]['start']==dates[0]
    assert score_windows(dates,[None]*7,[28]*7)==[]
